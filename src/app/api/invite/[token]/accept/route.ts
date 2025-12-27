import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ token: string }>;
};

const acceptInviteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

// POST /api/invite/[token]/accept - Accept an invite and create account
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        school: true,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: 'This invite has already been used' }, { status: 400 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This invite has expired' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const validatedData = acceptInviteSchema.parse(body);

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user and mark invite as used in a transaction
    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email: invite.email,
          name: validatedData.name,
          password: hashedPassword,
          role: invite.role,
          schoolId: invite.schoolId,
        },
      }),
      prisma.invite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      }),
      // Log the action
      prisma.auditLog.create({
        data: {
          action: 'USER_CREATED_VIA_INVITE',
          entity: 'User',
          metadata: {
            inviteId: invite.id,
            email: invite.email,
            role: invite.role,
            schoolId: invite.schoolId,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
