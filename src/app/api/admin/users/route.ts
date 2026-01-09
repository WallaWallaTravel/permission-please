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

    // Get query params
    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get('schoolId');

    // Enforce school isolation for non-SUPER_ADMIN users
    // SUPER_ADMIN can see all, ADMIN can only see their school
    let effectiveSchoolId: string | null = null;
    if (user.role === 'SUPER_ADMIN') {
      effectiveSchoolId = requestedSchoolId; // SUPER_ADMIN can filter or see all
    } else if (user.schoolId) {
      effectiveSchoolId = user.schoolId; // ADMIN sees only their school
    }

    // Build where clause with school isolation
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
