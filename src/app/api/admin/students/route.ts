import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { applyRateLimit } from '@/lib/rate-limit';

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

    // Get query params
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    // Build where clause
    const where = schoolId ? { schoolId } : {};

    const students = await prisma.student.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
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
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
