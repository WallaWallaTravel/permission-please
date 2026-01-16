import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { updateFormSchema } from '@/lib/validations/form-schema';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/forms/[id] - Get a specific form
export async function GET(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await prisma.permissionForm.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
        fields: {
          orderBy: {
            order: 'asc',
          },
        },
        documents: {
          orderBy: {
            order: 'asc',
          },
        },
        submissions: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            student: {
              select: {
                id: true,
                name: true,
                grade: true,
              },
            },
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check permissions - allow owner or users with shared access
    if (user.role === 'TEACHER' && form.teacherId !== user.id) {
      // Check if form is shared with this user
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

    return NextResponse.json({ form });
  } catch (error) {
    logger.error('Error fetching form', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/forms/[id] - Update a form
export async function PATCH(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'api');
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

    // Check if form exists and user owns it
    const existingForm = await prisma.permissionForm.findUnique({
      where: { id },
    });

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check ownership or edit permission via share
    if (existingForm.teacherId !== user.id && user.role !== 'ADMIN') {
      const share = await prisma.formShare.findUnique({
        where: {
          formId_userId: {
            formId: id,
            userId: user.id,
          },
        },
      });
      if (!share || !share.canEdit) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await request.json();
    const validatedData = updateFormSchema.parse(body);

    // Handle reopening a closed form
    if (existingForm.status === 'CLOSED' && validatedData.status === 'ACTIVE') {
      const eventDate = new Date(existingForm.eventDate);
      const now = new Date();

      // Don't allow reopening if event date has passed
      if (eventDate < now) {
        return NextResponse.json(
          { error: 'Cannot reopen form after the event date has passed' },
          { status: 400 }
        );
      }

      // Log the reopen action
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'FORM_REOPENED',
          entity: 'PermissionForm',
          entityId: id,
          metadata: {
            formTitle: existingForm.title,
            previousStatus: 'CLOSED',
            newStatus: 'ACTIVE',
          },
        },
      });
    }

    // Log closing a form
    if (existingForm.status === 'ACTIVE' && validatedData.status === 'CLOSED') {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'FORM_CLOSED',
          entity: 'PermissionForm',
          entityId: id,
          metadata: {
            formTitle: existingForm.title,
            previousStatus: 'ACTIVE',
            newStatus: 'CLOSED',
          },
        },
      });
    }

    // Handle documents and fields separately
    const { documents, fields } = body;

    // Use a transaction to update form, fields, and documents atomically
    const form = await prisma.$transaction(async (tx) => {
      // Update form metadata first
      const updatedForm = await tx.permissionForm.update({
        where: { id },
        data: {
          ...(validatedData.title && { title: validatedData.title }),
          ...(validatedData.description && { description: validatedData.description }),
          ...(validatedData.eventDate && { eventDate: new Date(validatedData.eventDate) }),
          ...(validatedData.eventType && { eventType: validatedData.eventType }),
          ...(validatedData.deadline && { deadline: new Date(validatedData.deadline) }),
          ...(validatedData.status && { status: validatedData.status }),
          ...(validatedData.remindersEnabled !== undefined && {
            remindersEnabled: validatedData.remindersEnabled,
          }),
          ...(validatedData.reminderSchedule && {
            reminderSchedule: validatedData.reminderSchedule,
          }),
        },
      });

      // Handle fields if provided - delete all and recreate
      if (fields && Array.isArray(fields)) {
        // Delete existing fields
        await tx.formField.deleteMany({
          where: { formId: id },
        });

        // Create new fields
        if (fields.length > 0) {
          await tx.formField.createMany({
            data: fields.map(
              (field: { fieldType: string; label: string; required: boolean; order: number }) => ({
                formId: id,
                fieldType: field.fieldType,
                label: field.label,
                required: field.required,
                order: field.order,
              })
            ),
          });
        }
      }

      // Fetch the updated form with all relations
      return tx.permissionForm.findUnique({
        where: { id },
        include: {
          fields: {
            orderBy: { order: 'asc' },
          },
          documents: {
            orderBy: { order: 'asc' },
          },
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found after update' }, { status: 500 });
    }

    // Handle new documents if provided (outside transaction for simplicity)
    if (documents && Array.isArray(documents)) {
      // Get existing document URLs to avoid duplicates
      const existingUrls = form.documents.map((d) => d.fileUrl);
      const newDocs = documents.filter(
        (d: { fileUrl: string }) => !existingUrls.includes(d.fileUrl)
      );

      if (newDocs.length > 0) {
        const maxOrder =
          form.documents.length > 0 ? Math.max(...form.documents.map((d) => d.order)) : 0;

        await prisma.formDocument.createMany({
          data: newDocs.map(
            (
              doc: {
                fileName: string;
                fileUrl: string;
                fileSize: number;
                mimeType: string;
                description?: string;
                source?: string;
                requiresAck?: boolean;
              },
              index: number
            ) => ({
              formId: id,
              fileName: doc.fileName,
              fileUrl: doc.fileUrl,
              fileSize: doc.fileSize,
              mimeType: doc.mimeType,
              description: doc.description || '',
              source: doc.source || 'external',
              requiresAck: doc.requiresAck !== false,
              order: maxOrder + index + 1,
            })
          ),
        });
      }
    }

    // Fetch final form state with documents
    const finalForm = await prisma.permissionForm.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        documents: {
          orderBy: { order: 'asc' },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Form updated successfully',
      form: finalForm,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as unknown as { issues: unknown[] };
      return NextResponse.json(
        { error: 'Validation error', details: zodError.issues },
        { status: 400 }
      );
    }

    logger.error('Error updating form', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/forms/[id] - Delete a form
export async function DELETE(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'api');
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

    // Check if form exists and user owns it
    const existingForm = await prisma.permissionForm.findUnique({
      where: { id },
    });

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (existingForm.teacherId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.permissionForm.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Form deleted successfully' });
  } catch (error) {
    logger.error('Error deleting form', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
