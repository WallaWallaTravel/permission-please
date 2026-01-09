import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { sendSignatureConfirmation } from '@/lib/email/resend';
import { auditLog, getRequestContext } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/rate-limit';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET - Load form data for signing (session auth required)
export async function GET(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const parentId = session.user.id;

    // Get the form with teacher info and documents
    const form = await prisma.permissionForm.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { name: true, email: true },
        },
        fields: {
          orderBy: { order: 'asc' },
        },
        documents: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (form.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Form is not active' }, { status: 400 });
    }

    // Get all of the parent's students
    const parentStudents = await prisma.parentStudent.findMany({
      where: { parentId },
      include: { student: true },
    });

    if (parentStudents.length === 0) {
      return NextResponse.json({ error: 'No students linked to your account' }, { status: 400 });
    }

    // Get existing submissions to check which students have already signed
    const existingSubmissions = await prisma.formSubmission.findMany({
      where: {
        formId: id,
        parentId,
        studentId: { in: parentStudents.map((ps) => ps.student.id) },
      },
      select: {
        studentId: true,
        status: true,
      },
    });

    // Build a map of student ID to signed status
    const signedMap = new Map(
      existingSubmissions.map((sub) => [sub.studentId, sub.status === 'SIGNED'])
    );

    // Build students array with signed status
    const students = parentStudents.map((ps) => ({
      id: ps.student.id,
      name: ps.student.name,
      grade: ps.student.grade,
      hasSigned: signedMap.get(ps.student.id) || false,
    }));

    // Check if ALL students have already signed
    const allSigned = students.every((s) => s.hasSigned);
    if (allSigned) {
      return NextResponse.json(
        { error: 'You have already signed this form for all your children' },
        { status: 400 }
      );
    }

    // Audit log form view
    const { ipAddress, userAgent } = getRequestContext(request);
    auditLog({
      action: 'FORM_VIEW',
      userId: parentId,
      userEmail: session.user.email || undefined,
      userRole: 'PARENT',
      resourceType: 'PermissionForm',
      resourceId: id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      id: form.id,
      title: form.title,
      description: form.description,
      eventDate: form.eventDate,
      eventType: form.eventType,
      deadline: form.deadline,
      teacher: form.teacher,
      fields: form.fields,
      students,
    });
  } catch (error) {
    logger.error('Error loading form for signing', error as Error);
    return NextResponse.json({ error: 'Failed to load form' }, { status: 500 });
  }
}

// POST - Submit signature (session auth required)
export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'formSubmit');
  if (rateLimited) return rateLimited;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const parentId = session.user.id;
    const email = session.user.email;
    const name = session.user.name;

    const body = await request.json();
    const { signatureData, studentId, fieldResponses } = body;

    if (!signatureData) {
      return NextResponse.json({ error: 'Signature is required' }, { status: 400 });
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Student selection is required' }, { status: 400 });
    }

    // Verify form exists and is active
    const form = await prisma.permissionForm.findUnique({
      where: { id },
      include: {
        teacher: { select: { name: true, email: true } },
        fields: true,
        school: { select: { name: true } },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (form.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Form is not active' }, { status: 400 });
    }

    // Check deadline
    if (new Date(form.deadline) < new Date()) {
      return NextResponse.json({ error: 'Form deadline has passed' }, { status: 400 });
    }

    // Verify student belongs to parent
    const parentStudent = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId,
        },
      },
      include: { student: true },
    });

    if (!parentStudent) {
      return NextResponse.json({ error: 'Student not linked to your account' }, { status: 400 });
    }

    // Get request context for audit
    const { ipAddress, userAgent } = getRequestContext(request);

    // Use transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Check if already signed for this student (with row-level locking via transaction)
      const existingSubmission = await tx.formSubmission.findUnique({
        where: {
          formId_parentId_studentId: {
            formId: id,
            parentId,
            studentId,
          },
        },
      });

      if (existingSubmission?.status === 'SIGNED') {
        return { alreadySigned: true, studentName: parentStudent.student.name };
      }

      // Create or update submission atomically
      const submission = await tx.formSubmission.upsert({
        where: {
          formId_parentId_studentId: {
            formId: id,
            parentId,
            studentId,
          },
        },
        create: {
          formId: id,
          parentId,
          studentId,
          signatureData,
          status: 'SIGNED',
          signedAt: new Date(),
          ipAddress,
        },
        update: {
          signatureData,
          status: 'SIGNED',
          signedAt: new Date(),
          ipAddress,
        },
      });

      // Save field responses within the same transaction
      if (fieldResponses && Object.keys(fieldResponses).length > 0) {
        // Delete existing responses
        await tx.fieldResponse.deleteMany({
          where: { submissionId: submission.id },
        });

        // Create new responses
        await tx.fieldResponse.createMany({
          data: Object.entries(fieldResponses).map(([fieldId, response]) => ({
            submissionId: submission.id,
            fieldId,
            response: String(response),
          })),
        });
      }

      return { alreadySigned: false, submission };
    });

    // Handle already signed case (outside transaction)
    if (result.alreadySigned) {
      return NextResponse.json(
        { error: `You have already signed this form for ${result.studentName}` },
        { status: 400 }
      );
    }

    const submission = result.submission!;

    // Audit log signature submission
    auditLog({
      action: 'SIGNATURE_SUBMIT',
      userId: parentId,
      userEmail: email || undefined,
      userRole: 'PARENT',
      resourceType: 'FormSubmission',
      resourceId: submission.id,
      metadata: {
        formId: id,
        formTitle: form.title,
        studentId,
        studentName: parentStudent.student.name,
      },
      ipAddress,
      userAgent,
    });

    // Send confirmation email (async, don't block response)
    if (email && process.env.RESEND_API_KEY) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:6001';
      const pdfUrl = `${baseUrl}/api/submissions/${submission.id}/pdf`;

      sendSignatureConfirmation({
        parentEmail: email,
        parentName: name || 'Parent',
        studentName: parentStudent.student.name,
        formTitle: form.title,
        eventDate: form.eventDate,
        signedAt: new Date(),
        pdfUrl,
        schoolName: form.school?.name,
      }).catch((err) => {
        logger.error('Failed to send confirmation email', err);
      });
    }

    logger.info('Signature submitted successfully', {
      formId: id,
      studentId,
      parentId,
    });

    return NextResponse.json({
      success: true,
      message: `Signature submitted successfully for ${parentStudent.student.name}`,
    });
  } catch (error) {
    logger.error('Error submitting signature', error as Error);
    return NextResponse.json({ error: 'Failed to submit signature' }, { status: 500 });
  }
}

