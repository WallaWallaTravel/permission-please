import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// GET /api/admin/users - List all users (optionally filtered by schoolId)
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

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        createdAt: true,
        school: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
        _count: {
          select: {
            forms: true,
            formSubmissions: true,
          },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    logger.error('Error fetching users', error as Error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
