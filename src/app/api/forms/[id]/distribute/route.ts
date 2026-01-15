import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { sendPermissionRequest } from '@/lib/email/resend';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// POST - Distribute form to parents
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = applyRateLimit(request, 'email');
  if (rateLimited) return rateLimited;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Parse optional groupIds from request body
    let groupIds: string[] | undefined;
    try {
      const body = await request.json();
      groupIds = body.groupIds;
    } catch {
      // No body or invalid JSON - that's fine, send to all
    }

    // Verify form exists and belongs to teacher, include school for filtering
    const form = await prisma.permissionForm.findUnique({
      where: { id },
      include: {
        teacher: { select: { name: true, schoolId: true } },
        school: { select: { name: true } },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (form.teacherId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Use transaction for atomicity: activate form + create submissions
    const result = await prisma.$transaction(async (tx) => {
      // Activate form if in draft
      if (form.status === 'DRAFT') {
        await tx.permissionForm.update({
          where: { id },
          data: { status: 'ACTIVE' },
        });
      }

      // Get students filtered by school (if form has school context)
      const schoolFilter = form.schoolId ? { schoolId: form.schoolId } : {};

      // If groupIds provided, filter to only students in those groups
      let groupMemberFilter = {};
      if (groupIds && groupIds.length > 0) {
        groupMemberFilter = {
          groups: {
            some: {
              groupId: { in: groupIds },
            },
          },
        };
      }

      const students = await tx.student.findMany({
        where: {
          ...schoolFilter,
          ...groupMemberFilter,
          parents: { some: {} }, // Only students with at least one parent
        },
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

      if (students.length === 0) {
        // Check if there are students without parents vs no students at all
        const allStudentsCount = await tx.student.count({
          where: schoolFilter,
        });
        if (allStudentsCount === 0) {
          throw new Error('NO_STUDENTS_IN_SCHOOL');
        } else {
          throw new Error('NO_STUDENTS_WITH_PARENTS');
        }
      }

      // Collect all parent-student pairs for batch submission creation
      const submissionData: Array<{
        formId: string;
        parentId: string;
        studentId: string;
        signatureData: string;
        status: 'PENDING';
        parentEmail: string;
        parentName: string;
        studentName: string;
      }> = [];

      for (const student of students) {
        for (const { parent } of student.parents) {
          submissionData.push({
            formId: id,
            parentId: parent.id,
            studentId: student.id,
            signatureData: '',
            status: 'PENDING',
            parentEmail: parent.email,
            parentName: parent.name,
            studentName: student.name,
          });
        }
      }

      // Batch create submissions (skip duplicates with skipDuplicates)
      // Note: We need to use upsert in a loop since createMany doesn't support skipDuplicates for composite unique
      const createdSubmissions = await Promise.all(
        submissionData.map((data) =>
          tx.formSubmission.upsert({
            where: {
              formId_parentId_studentId: {
                formId: data.formId,
                parentId: data.parentId,
                studentId: data.studentId,
              },
            },
            create: {
              formId: data.formId,
              parentId: data.parentId,
              studentId: data.studentId,
              signatureData: '',
              status: 'PENDING',
            },
            update: {}, // Don't update if already exists
            select: { id: true, parentId: true, studentId: true, status: true },
          })
        )
      );

      return { submissionData, createdSubmissions };
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:6001';
    const signUrl = `${baseUrl}/parent/sign/${id}`;

    const emailsSent: string[] = [];
    const errors: string[] = [];

    // Only send emails if Resend is configured
    if (process.env.RESEND_API_KEY) {
      // Group by parent email, collecting student names
      const parentEmails = new Map<
        string,
        {
          email: string;
          name: string;
          studentNames: string[];
        }
      >();

      for (const data of result.submissionData) {
        const existing = parentEmails.get(data.parentEmail);
        if (existing) {
          existing.studentNames.push(data.studentName);
        } else {
          parentEmails.set(data.parentEmail, {
            email: data.parentEmail,
            name: data.parentName,
            studentNames: [data.studentName],
          });
        }
      }

      // Send emails (in parallel batches of 5 to avoid rate limits)
      const parentEntries = Array.from(parentEmails.values());
      const batchSize = 5;
      const schoolName = form.school?.name || 'School';

      for (let i = 0; i < parentEntries.length; i += batchSize) {
        const batch = parentEntries.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map(async (parent) => {
            try {
              await sendPermissionRequest({
                parentEmail: parent.email,
                parentName: parent.name,
                studentName: parent.studentNames.join(', '),
                formTitle: form.title,
                eventDate: form.eventDate,
                deadline: form.deadline,
                signUrl,
                teacherName: form.teacher.name,
                schoolName,
                description: form.description,
              });
              emailsSent.push(parent.email);
            } catch (err) {
              logger.error(`Failed to send email to ${parent.email}`, err as Error);
              errors.push(parent.email);
            }
          })
        );
      }
    } else {
      // Mark all as sent but note email not configured
      result.submissionData.forEach((d) => {
        if (!emailsSent.includes(d.parentEmail)) {
          emailsSent.push(`${d.parentEmail} (email service not configured)`);
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Form distributed to ${emailsSent.length} parent(s)`,
      submissionsCreated: result.createdSubmissions.length,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NO_STUDENTS_IN_SCHOOL') {
        return NextResponse.json(
          {
            error: 'No students found. Add students first at Students page.',
            code: 'NO_STUDENTS',
            actionUrl: '/teacher/students',
          },
          { status: 400 }
        );
      }
      if (error.message === 'NO_STUDENTS_WITH_PARENTS') {
        return NextResponse.json(
          {
            error:
              'Students exist but no parents are linked yet. Link parents to students at Students page.',
            code: 'NO_PARENT_LINKS',
            actionUrl: '/teacher/students',
          },
          { status: 400 }
        );
      }
    }
    logger.error('Error distributing form', error as Error);
    return NextResponse.json({ error: 'Failed to distribute form' }, { status: 500 });
  }
}
