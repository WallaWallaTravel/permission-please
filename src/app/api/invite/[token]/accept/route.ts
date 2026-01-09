import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

type RouteContext = {
  params: Promise<{ token: string }>;
};

const acceptInviteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

// POST /api/invite/[token]/accept - Accept an invite and create account
export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  try {
    const { token } = await context.params;

    // Parse and validate body first (before transaction)
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const validatedData = acceptInviteSchema.parse(body);

    // Use interactive transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Find invite with lock (transaction provides isolation)
      const invite = await tx.invite.findUnique({
        where: { token },
        include: { school: true },
      });

      if (!invite) {
        return { error: 'Invite not found', status: 404 };
      }

      if (invite.usedAt) {
        return { error: 'This invite has already been used', status: 400 };
      }

      if (invite.expiresAt < new Date()) {
        return { error: 'This invite has expired', status: 400 };
      }

      // Check if user already exists (within transaction)
      const existingUser = await tx.user.findUnique({
        where: { email: invite.email },
      });

      if (existingUser) {
        return { error: 'An account with this email already exists', status: 409 };
      }

      // Create user without password (will sign in via Google OAuth or Magic Link)
      const user = await tx.user.create({
        data: {
          email: invite.email,
          name: validatedData.name,
          role: invite.role,
          schoolId: invite.schoolId,
        },
      });

      // Mark invite as used
      await tx.invite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_CREATED_VIA_INVITE',
          entity: 'User',
          entityId: user.id,
          metadata: {
            inviteId: invite.id,
            email: invite.email,
            role: invite.role,
            schoolId: invite.schoolId,
          },
        },
      });

      return { user };
    });

    // Handle validation errors from transaction
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error accepting invite', error as Error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
