import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
});

// GET /api/groups - List all groups for the user's school
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const groups = await prisma.studentGroup.findMany({
      where: {
        schoolId: user.schoolId,
      },
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
      orderBy: {
        name: 'asc',
      },
    });

    // Transform to include member count
    const groupsWithCounts = groups.map((group) => ({
      id: group.id,
      name: group.name,
      schoolId: group.schoolId,
      createdAt: group.createdAt,
      memberCount: group.members.length,
      members: group.members.map((m) => m.student),
    }));

    return NextResponse.json({ groups: groupsWithCounts });
  } catch (error) {
    logger.error('Error fetching groups', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createGroupSchema.parse(body);

    const group = await prisma.studentGroup.create({
      data: {
        name: validatedData.name,
        schoolId: user.schoolId,
      },
    });

    return NextResponse.json(
      {
        message: 'Group created successfully',
        group,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as unknown as { issues: unknown[] };
      return NextResponse.json(
        { error: 'Validation error', details: zodError.issues },
        { status: 400 }
      );
    }

    logger.error('Error creating group', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
