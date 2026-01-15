import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
});

// GET /api/groups/[id] - Get a specific group with members
export async function GET(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const group = await prisma.studentGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                grade: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check that user belongs to same school
    if (group.schoolId !== user.schoolId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        schoolId: group.schoolId,
        createdAt: group.createdAt,
        memberCount: group.members.length,
        members: group.members.map((m) => m.student),
      },
    });
  } catch (error) {
    logger.error('Error fetching group', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/groups/[id] - Update group name
export async function PATCH(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingGroup = await prisma.studentGroup.findUnique({
      where: { id },
    });

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (existingGroup.schoolId !== user.schoolId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateGroupSchema.parse(body);

    const group = await prisma.studentGroup.update({
      where: { id },
      data: {
        name: validatedData.name,
      },
    });

    return NextResponse.json({
      message: 'Group updated successfully',
      group,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as unknown as { issues: unknown[] };
      return NextResponse.json(
        { error: 'Validation error', details: zodError.issues },
        { status: 400 }
      );
    }

    logger.error('Error updating group', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/groups/[id] - Delete a group
export async function DELETE(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingGroup = await prisma.studentGroup.findUnique({
      where: { id },
    });

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (existingGroup.schoolId !== user.schoolId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete group (members will cascade delete due to FK constraint)
    await prisma.studentGroup.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error) {
    logger.error('Error deleting group', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
