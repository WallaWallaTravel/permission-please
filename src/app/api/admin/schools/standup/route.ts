import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { sendInviteEmail } from '@/lib/email/resend';
import { z } from 'zod';
import crypto from 'crypto';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { parseLicenseDate } from '@/lib/auth/license';

const standupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  subdomain: z
    .string()
    .min(2)
    .max(63)
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      'Subdomain must be lowercase alphanumeric with optional hyphens'
    ),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  licensedThrough: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'License date must be YYYY-MM-DD'),
  adminEmail: z.string().email('Admin email is required'),
});

export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 'email');
  if (rateLimited) return rateLimited;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = standupSchema.parse(body);
    const subdomain = data.subdomain.toLowerCase();
    const licensedThrough = parseLicenseDate(data.licensedThrough);

    const existingSchool = await prisma.school.findUnique({
      where: { subdomain },
    });

    if (existingSchool) {
      return NextResponse.json(
        { error: 'A school with this subdomain already exists' },
        { status: 409 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.adminEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const existingInvite = await prisma.invite.findFirst({
      where: {
        email: data.adminEmail,
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

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { school } = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: data.name,
          subdomain,
          primaryColor: data.primaryColor,
          licensedThrough,
          isActive: true,
        },
      });

      const invite = await tx.invite.create({
        data: {
          email: data.adminEmail,
          token,
          role: 'ADMIN',
          schoolId: school.id,
          expiresAt,
          createdBy: user.id,
        },
      });

      return { school, invite };
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'https://permissionplease.app';
    const inviteUrl = `${baseUrl}/invite/${token}`;

    let emailSent = false;
    try {
      await sendInviteEmail({
        email: data.adminEmail,
        inviteUrl,
        role: 'ADMIN',
        schoolName: school.name,
        inviterName: user.name,
      });
      emailSent = true;
    } catch (emailError) {
      logger.error('Failed to send standup invite email', emailError as Error);
    }

    return NextResponse.json(
      {
        message: emailSent
          ? 'School created and admin invite sent'
          : 'School created but the invite email could not be sent',
        school,
        inviteUrl,
        emailSent,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    logger.error('Error standing up school', error as Error);
    return NextResponse.json({ error: 'Failed to stand up school' }, { status: 500 });
  }
}
