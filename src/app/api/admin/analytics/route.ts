import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
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

    if (user.role === 'ADMIN' && !user.schoolId) {
      return NextResponse.json({ error: 'User must be assigned to a school' }, { status: 403 });
    }

    const schoolScope = user.role === 'SUPER_ADMIN' ? {} : { schoolId: user.schoolId };
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all counts in parallel
    const formScope = schoolScope;
    const submissionScope =
      user.role === 'SUPER_ADMIN' ? {} : { form: { schoolId: user.schoolId } };
    const schoolCountScope = user.role === 'SUPER_ADMIN' ? {} : { id: user.schoolId || '__none__' };

    const [
      totalSchools,
      activeSchools,
      totalUsers,
      usersByRole,
      totalForms,
      formsByStatus,
      totalSubmissions,
      submissionsByStatus,
      recentForms,
      recentSubmissions,
      formsOverTime,
      submissionsOverTime,
    ] = await Promise.all([
      prisma.school.count({ where: schoolCountScope }),
      prisma.school.count({ where: { isActive: true, ...schoolCountScope } }),
      prisma.user.count({ where: formScope }),
      prisma.user.groupBy({
        by: ['role'],
        where: formScope,
        _count: { id: true },
      }),
      prisma.permissionForm.count({ where: formScope }),
      prisma.permissionForm.groupBy({
        by: ['status'],
        where: formScope,
        _count: { id: true },
      }),
      prisma.formSubmission.count({ where: submissionScope }),
      prisma.formSubmission.groupBy({
        by: ['status'],
        where: submissionScope,
        _count: { id: true },
      }),
      prisma.permissionForm.count({
        where: { createdAt: { gte: sevenDaysAgo }, ...formScope },
      }),
      prisma.formSubmission.count({
        where: { signedAt: { gte: sevenDaysAgo }, ...submissionScope },
      }),
      prisma.permissionForm.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, ...formScope },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.formSubmission.findMany({
        where: { signedAt: { gte: thirtyDaysAgo }, ...submissionScope },
        select: { signedAt: true },
        orderBy: { signedAt: 'asc' },
      }),
    ]);

    // Process forms over time
    const formsByDay = new Map<string, number>();
    formsOverTime.forEach((form) => {
      const date = form.createdAt.toISOString().split('T')[0];
      formsByDay.set(date, (formsByDay.get(date) || 0) + 1);
    });

    // Process submissions over time
    const submissionsByDay = new Map<string, number>();
    submissionsOverTime.forEach((sub) => {
      if (sub.signedAt) {
        const date = sub.signedAt.toISOString().split('T')[0];
        submissionsByDay.set(date, (submissionsByDay.get(date) || 0) + 1);
      }
    });

    // Generate timeline data for last 30 days
    const timeline = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      timeline.push({
        date: dateStr,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        forms: formsByDay.get(dateStr) || 0,
        submissions: submissionsByDay.get(dateStr) || 0,
      });
    }

    // Convert grouped data to objects
    const usersByRoleObj: Record<string, number> = {};
    usersByRole.forEach((item) => {
      usersByRoleObj[item.role] = item._count.id;
    });

    const formsByStatusObj: Record<string, number> = {};
    formsByStatus.forEach((item) => {
      formsByStatusObj[item.status] = item._count.id;
    });

    const submissionsByStatusObj: Record<string, number> = {};
    submissionsByStatus.forEach((item) => {
      submissionsByStatusObj[item.status] = item._count.id;
    });

    // Calculate response rate
    const signedSubmissions = submissionsByStatusObj['SIGNED'] || 0;
    const responseRate =
      totalSubmissions > 0 ? Math.round((signedSubmissions / totalSubmissions) * 100) : 0;

    return NextResponse.json({
      overview: {
        totalSchools,
        activeSchools,
        totalUsers,
        totalForms,
        totalSubmissions,
        signedSubmissions,
        responseRate,
        recentForms,
        recentSubmissions,
      },
      usersByRole: usersByRoleObj,
      formsByStatus: formsByStatusObj,
      submissionsByStatus: submissionsByStatusObj,
      timeline,
    });
  } catch (error) {
    logger.error('Error fetching analytics', error as Error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
