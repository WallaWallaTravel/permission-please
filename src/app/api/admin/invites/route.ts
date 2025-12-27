import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { sendInviteEmail } from '@/lib/email/resend';
import { z } from 'zod';
import crypto from 'crypto';

const createInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['TEACHER', 'ADMIN']),
  schoolId: z.string().optional(),
});

// GET /api/admin/invites - List all invites
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const invites = await prisma.invite.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        school: {
          select: { id: true, name: true, subdomain: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }
}

// POST /api/admin/invites - Create a new invite
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createInviteSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    // Check for existing pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: {
        email: validatedData.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An active invite already exists for this email' },
        { status: 409 }
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invite (expires in 7 days)
    const invite = await prisma.invite.create({
      data: {
        email: validatedData.email,
        token,
        role: validatedData.role,
        schoolId: validatedData.schoolId || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: user.id,
      },
      include: {
        school: {
          select: { id: true, name: true, subdomain: true },
        },
      },
    });

    // Generate invite URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://permissionplease.app';
    const inviteUrl = `${baseUrl}/invite/${token}`;

    // Send invite email
    let emailSent = false;
    try {
      await sendInviteEmail({
        email: invite.email,
        inviteUrl,
        role: invite.role,
        schoolName: invite.school?.name,
        inviterName: user.name,
      });
      emailSent = true;
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      // Don't fail the request if email fails - the invite is still created
    }

    return NextResponse.json(
      {
        message: emailSent
          ? 'Invite created and email sent successfully'
          : 'Invite created but email could not be sent',
        invite,
        inviteUrl,
        emailSent,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating invite:', error);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}
