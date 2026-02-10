import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/forms/[id]/export-csv - Export submissions as CSV
export async function GET(request: NextRequest, context: RouteContext) {
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

    // Fetch form with submissions and related data
    const form = await prisma.permissionForm.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        submissions: {
          include: {
            parent: {
              select: { name: true, email: true },
            },
            student: {
              select: { name: true, grade: true },
            },
            responses: {
              include: {
                field: {
                  select: { label: true },
                },
              },
            },
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check ownership or admin access
    if (form.teacherId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      const share = await prisma.formShare.findUnique({
        where: {
          formId_userId: {
            formId: id,
            userId: user.id,
          },
        },
      });
      if (!share) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Build CSV
    const fieldLabels = form.fields.map((f) => f.label);

    // Header row
    const headers = [
      'Student Name',
      'Grade',
      'Parent Name',
      'Parent Email',
      'Status',
      'Signed At',
      ...fieldLabels,
    ];

    // Data rows
    const rows = form.submissions.map((sub) => {
      const fieldResponses = fieldLabels.map((label) => {
        const response = sub.responses.find((r) => r.field.label === label);
        return response ? response.response : '';
      });

      return [
        sub.student.name,
        sub.student.grade,
        sub.parent.name,
        sub.parent.email,
        sub.status,
        sub.signedAt
          ? new Date(sub.signedAt).toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        ...fieldResponses,
      ];
    });

    // Convert to CSV string
    const csvRows = [headers, ...rows].map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    );

    const csv = csvRows.join('\n');

    // Sanitize filename
    const safeTitle =
      form.title
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 40) || 'form';

    const filename = `${safeTitle}-submissions.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error('Error exporting CSV', error as Error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}
