import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const shareSchema = z.object({
  email: z.string().email('Invalid email address'),
  canEdit: z.boolean().optional().default(false),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/forms/[id]/share - Get list of users this form is shared with
export async function GET(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns the form or has it shared with them
    const form = await prisma.permissionForm.findUnique({
      where: { id },
      include: {
        shares: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const isOwner = form.teacherId === user.id;
    const isSharedWith = form.shares.some((s) => s.userId === user.id);

    if (!isOwner && !isSharedWith && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      shares: form.shares.map((s) => ({
        id: s.id,
        user: s.user,
        canEdit: s.canEdit,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    logger.error('Error fetching form shares', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/forms/[id]/share - Share form with another user
export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns the form
    const form = await prisma.permissionForm.findUnique({
      where: { id },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (form.teacherId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only the form owner can share it' }, { status: 403 });
    }

    const body = await request.json();
    const { email, canEdit } = shareSchema.parse(body);

    // Find the user to share with
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found. They must have an account first.' },
        { status: 404 }
      );
    }

    // Can't share with yourself
    if (targetUser.id === user.id) {
      return NextResponse.json({ error: "You can't share a form with yourself" }, { status: 400 });
    }

    // Can't share with parents
    if (targetUser.role === 'PARENT') {
      return NextResponse.json(
        { error: 'Forms can only be shared with teachers and staff' },
        { status: 400 }
      );
    }

    // Create or update share
    const share = await prisma.formShare.upsert({
      where: {
        formId_userId: {
          formId: id,
          userId: targetUser.id,
        },
      },
      create: {
        formId: id,
        userId: targetUser.id,
        canEdit,
      },
      update: {
        canEdit,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Form shared with ${targetUser.name}`,
      share: {
        id: share.id,
        user: share.user,
        canEdit: share.canEdit,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    logger.error('Error sharing form', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/forms/[id]/share - Remove share
export async function DELETE(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json({ error: 'shareId is required' }, { status: 400 });
    }

    // Check if user owns the form
    const form = await prisma.permissionForm.findUnique({
      where: { id },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (form.teacherId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only the form owner can remove shares' }, { status: 403 });
    }

    // Delete the share
    await prisma.formShare.delete({
      where: { id: shareId },
    });

    return NextResponse.json({ success: true, message: 'Share removed' });
  } catch (error) {
    logger.error('Error removing share', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
