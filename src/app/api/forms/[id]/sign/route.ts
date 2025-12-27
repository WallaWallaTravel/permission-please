import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { sendSignatureConfirmation } from '@/lib/email/resend';
import { auditLog, getRequestContext } from '@/lib/audit';
import { logger } from '@/lib/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET - Load form data for signing (supports multiple students)
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Get the form with teacher info
    const form = await prisma.permissionForm.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { name: true, email: true },
        },
        fields: {
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

    // Get ALL of the parent's students (multi-student support)
    const parentStudents = await prisma.parentStudent.findMany({
      where: { parentId: session.user.id },
      include: { student: true },
    });

    if (parentStudents.length === 0) {
      return NextResponse.json({ error: 'No students linked to your account' }, { status: 400 });
    }

    // Get existing submissions to check which students have already signed
    const existingSubmissions = await prisma.formSubmission.findMany({
      where: {
        formId: id,
        parentId: session.user.id,
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
      userId: session.user.id,
      userEmail: session.user.email || undefined,
      userRole: session.user.role,
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
      students, // Return all students with their signed status
    });
  } catch (error) {
    logger.error('Error loading form for signing', error as Error);
    return NextResponse.json({ error: 'Failed to load form' }, { status: 500 });
  }
}

// POST - Submit signature
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
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
          parentId: session.user.id,
          studentId,
        },
      },
      include: { student: true },
    });

    if (!parentStudent) {
      return NextResponse.json({ error: 'Student not linked to your account' }, { status: 400 });
    }

    // Check if already signed for this student
    const existingSubmission = await prisma.formSubmission.findUnique({
      where: {
        formId_parentId_studentId: {
          formId: id,
          parentId: session.user.id,
          studentId,
        },
      },
    });

    if (existingSubmission?.status === 'SIGNED') {
      return NextResponse.json(
        { error: `You have already signed this form for ${parentStudent.student.name}` },
        { status: 400 }
      );
    }

    // Get request context for audit
    const { ipAddress, userAgent } = getRequestContext(request);

    // Create or update submission
    const submission = await prisma.formSubmission.upsert({
      where: {
        formId_parentId_studentId: {
          formId: id,
          parentId: session.user.id,
          studentId,
        },
      },
      create: {
        formId: id,
        parentId: session.user.id,
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

    // Save field responses
    if (fieldResponses && Object.keys(fieldResponses).length > 0) {
      // Delete existing responses
      await prisma.fieldResponse.deleteMany({
        where: { submissionId: submission.id },
      });

      // Create new responses
      await prisma.fieldResponse.createMany({
        data: Object.entries(fieldResponses).map(([fieldId, response]) => ({
          submissionId: submission.id,
          fieldId,
          response: String(response),
        })),
      });
    }

    // Audit log signature submission
    auditLog({
      action: 'SIGNATURE_SUBMIT',
      userId: session.user.id,
      userEmail: session.user.email || undefined,
      userRole: session.user.role,
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
    if (session.user.email && process.env.RESEND_API_KEY) {
      sendSignatureConfirmation({
        parentEmail: session.user.email,
        parentName: session.user.name || 'Parent',
        studentName: parentStudent.student.name,
        formTitle: form.title,
        eventDate: form.eventDate,
      }).catch((err) => {
        logger.error('Failed to send confirmation email', err);
      });
    }

    logger.info('Signature submitted successfully', {
      formId: id,
      studentId,
      parentId: session.user.id,
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
