import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/forms/[id]/duplicate - Duplicate a form with fields and documents
export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'formSubmit');
  if (rateLimited) return rateLimited;

  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch original form with fields and documents
    const original = await prisma.permissionForm.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        documents: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!original) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Only owner can duplicate
    if (original.teacherId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create duplicate in a transaction
    const newForm = await prisma.$transaction(async (tx) => {
      // Create the new form as DRAFT
      const form = await tx.permissionForm.create({
        data: {
          teacherId: user.id,
          schoolId: original.schoolId,
          title: `${original.title} (Copy)`,
          description: original.description,
          eventDate: original.eventDate,
          eventType: original.eventType,
          deadline: original.deadline,
          status: 'DRAFT',
          reminderSchedule: original.reminderSchedule ?? undefined,
          remindersEnabled: original.remindersEnabled,
          requiresReview: original.requiresReview,
          isExpedited: false,
          // Reset review fields
          reviewStatus: null,
          reviewNeededBy: null,
          reviewedBy: null,
          reviewedAt: null,
          reviewComments: null,
        },
      });

      // Copy fields
      if (original.fields.length > 0) {
        await tx.formField.createMany({
          data: original.fields.map((field) => ({
            formId: form.id,
            fieldType: field.fieldType,
            label: field.label,
            required: field.required,
            order: field.order,
          })),
        });
      }

      // Copy documents (reuse same file URLs)
      if (original.documents.length > 0) {
        await tx.formDocument.createMany({
          data: original.documents.map((doc) => ({
            formId: form.id,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            description: doc.description,
            source: doc.source,
            requiresAck: doc.requiresAck,
            order: doc.order,
          })),
        });
      }

      return form;
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FORM_DUPLICATED',
        entity: 'PermissionForm',
        entityId: newForm.id,
        metadata: {
          originalFormId: id,
          originalTitle: original.title,
          newTitle: newForm.title,
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Form duplicated successfully',
        form: {
          id: newForm.id,
          title: newForm.title,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error duplicating form', error as Error);
    return NextResponse.json({ error: 'Failed to duplicate form' }, { status: 500 });
  }
}
