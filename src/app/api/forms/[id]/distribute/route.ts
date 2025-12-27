import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { sendPermissionRequest } from '@/lib/email/resend';

// POST - Distribute form to parents
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify form exists and belongs to teacher
    const form = await prisma.permissionForm.findUnique({
      where: { id },
      include: {
        teacher: { select: { name: true } },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (form.teacherId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Activate form if in draft
    if (form.status === 'DRAFT') {
      await prisma.permissionForm.update({
        where: { id },
        data: { status: 'ACTIVE' },
      });
    }

    // Get all students with their parents
    const students = await prisma.student.findMany({
      include: {
        parents: {
          include: {
            parent: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });

    // Filter to students with parents
    const studentsWithParents = students.filter((s) => s.parents.length > 0);

    if (studentsWithParents.length === 0) {
      return NextResponse.json({ error: 'No students with linked parents found' }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:6001';
    const signUrl = `${baseUrl}/parent/sign/${id}`;

    const emailsSent: string[] = [];
    const errors: string[] = [];

    // Create pending submissions and send emails
    for (const student of studentsWithParents) {
      for (const { parent } of student.parents) {
        try {
          // Create pending submission if doesn't exist
          await prisma.formSubmission.upsert({
            where: {
              formId_parentId_studentId: {
                formId: id,
                parentId: parent.id,
                studentId: student.id,
              },
            },
            create: {
              formId: id,
              parentId: parent.id,
              studentId: student.id,
              signatureData: '',
              status: 'PENDING',
            },
            update: {},
          });

          // Send email notification (only if Resend is configured)
          if (process.env.RESEND_API_KEY) {
            await sendPermissionRequest({
              parentEmail: parent.email,
              parentName: parent.name,
              studentName: student.name,
              formTitle: form.title,
              eventDate: form.eventDate,
              deadline: form.deadline,
              signUrl,
              teacherName: form.teacher.name,
            });
            emailsSent.push(parent.email);
          } else {
            emailsSent.push(`${parent.email} (email service not configured)`);
          }
        } catch (err) {
          console.error(`Failed to process ${parent.email}:`, err);
          errors.push(parent.email);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Form distributed to ${emailsSent.length} parent(s)`,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error distributing form:', error);
    return NextResponse.json({ error: 'Failed to distribute form' }, { status: 500 });
  }
}
