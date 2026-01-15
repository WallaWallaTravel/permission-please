import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateMembersSchema = z.object({
  studentIds: z.array(z.string()).min(0),
});

const removeMemberSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
});

// POST /api/groups/[id]/members - Set group members (replaces all members)
export async function POST(request: NextRequest, context: RouteContext) {
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

    const group = await prisma.studentGroup.findUnique({
      where: { id },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.schoolId !== user.schoolId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateMembersSchema.parse(body);

    // Verify all students belong to the same school
    if (validatedData.studentIds.length > 0) {
      const students = await prisma.student.findMany({
        where: {
          id: { in: validatedData.studentIds },
          schoolId: group.schoolId,
        },
      });

      if (students.length !== validatedData.studentIds.length) {
        return NextResponse.json(
          { error: 'Some students do not belong to this school' },
          { status: 400 }
        );
      }
    }

    // Transaction: Delete all existing members and add new ones
    await prisma.$transaction([
      prisma.studentGroupMember.deleteMany({
        where: { groupId: id },
      }),
      prisma.studentGroupMember.createMany({
        data: validatedData.studentIds.map((studentId) => ({
          groupId: id,
          studentId,
        })),
      }),
    ]);

    // Fetch updated group
    const updatedGroup = await prisma.studentGroup.findUnique({
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

    return NextResponse.json({
      message: 'Group members updated successfully',
      group: {
        id: updatedGroup?.id,
        name: updatedGroup?.name,
        memberCount: updatedGroup?.members.length,
        members: updatedGroup?.members.map((m) => m.student),
      },
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as unknown as { issues: unknown[] };
      return NextResponse.json(
        { error: 'Validation error', details: zodError.issues },
        { status: 400 }
      );
    }

    logger.error('Error updating group members', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/groups/[id]/members - Remove a single student from group
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

    const group = await prisma.studentGroup.findUnique({
      where: { id },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.schoolId !== user.schoolId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = removeMemberSchema.parse(body);

    // Delete the membership
    await prisma.studentGroupMember.delete({
      where: {
        groupId_studentId: {
          groupId: id,
          studentId: validatedData.studentId,
        },
      },
    });

    return NextResponse.json({ message: 'Student removed from group successfully' });
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as unknown as { issues: unknown[] };
      return NextResponse.json(
        { error: 'Validation error', details: zodError.issues },
        { status: 400 }
      );
    }

    // Handle case where member doesn't exist
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Student is not a member of this group' }, { status: 404 });
    }

    logger.error('Error removing group member', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
