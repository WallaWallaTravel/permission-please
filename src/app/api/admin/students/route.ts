import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// GET /api/admin/students - List students (optionally filtered by schoolId)
export async function GET(request: Request) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get('schoolId');

    if (user.role !== 'SUPER_ADMIN' && !user.schoolId) {
      return NextResponse.json({ error: 'User must be assigned to a school' }, { status: 403 });
    }

    const effectiveSchoolId = user.role === 'SUPER_ADMIN' ? requestedSchoolId : user.schoolId;

    const where = effectiveSchoolId ? { schoolId: effectiveSchoolId } : {};

    const students = await prisma.student.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        school: {
          select: { id: true, name: true },
        },
        parents: {
          include: {
            parent: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: {
            formSubmissions: true,
          },
        },
      },
    });

    return NextResponse.json({ students });
  } catch (error) {
    logger.error('Error fetching students', error as Error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
