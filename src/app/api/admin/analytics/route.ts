import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { applyRateLimit } from '@/lib/rate-limit';

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

    // Get date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all counts in parallel
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
      // Total schools
      prisma.school.count(),

      // Active schools
      prisma.school.count({ where: { isActive: true } }),

      // Total users
      prisma.user.count(),

      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),

      // Total forms
      prisma.permissionForm.count(),

      // Forms by status
      prisma.permissionForm.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Total submissions
      prisma.formSubmission.count(),

      // Submissions by status
      prisma.formSubmission.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Recent forms (last 7 days)
      prisma.permissionForm.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),

      // Recent submissions (last 7 days)
      prisma.formSubmission.count({
        where: { signedAt: { gte: sevenDaysAgo } },
      }),

      // Forms created over last 30 days (grouped by day)
      prisma.permissionForm.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),

      // Submissions over last 30 days (grouped by day)
      prisma.formSubmission.findMany({
        where: { signedAt: { gte: thirtyDaysAgo } },
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
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
