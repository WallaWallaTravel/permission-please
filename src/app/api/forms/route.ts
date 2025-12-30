import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { createFormSchema } from '@/lib/validations/form-schema';
import { applyRateLimit } from '@/lib/rate-limit';

// GET /api/forms - List all forms for the current user
export async function GET(request: Request) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build query based on role
    const where =
      user.role === 'TEACHER' || user.role === 'ADMIN'
        ? {
            teacherId: user.id,
            ...(status && { status: status as 'DRAFT' | 'ACTIVE' | 'CLOSED' }),
          }
        : undefined;

    const forms = await prisma.permissionForm.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            submissions: true,
            fields: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ forms });
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/forms - Create a new form
export async function POST(request: Request) {
  const rateLimited = applyRateLimit(request, 'formSubmit');
  if (rateLimited) return rateLimited;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers and admins can create forms
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = createFormSchema.parse(body);

    // Create form with fields
    const form = await prisma.permissionForm.create({
      data: {
        teacherId: user.id,
        title: validatedData.title,
        description: validatedData.description,
        eventDate: new Date(validatedData.eventDate),
        eventType: validatedData.eventType,
        deadline: new Date(validatedData.deadline),
        status: validatedData.status,
        fields: validatedData.fields
          ? {
              create: validatedData.fields.map((field) => ({
                fieldType: field.fieldType,
                label: field.label,
                required: field.required,
                order: field.order,
              })),
            }
          : undefined,
      },
      include: {
        fields: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Form created successfully',
        form,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as unknown as { issues: unknown[] };
      return NextResponse.json(
        { error: 'Validation error', details: zodError.issues },
        { status: 400 }
      );
    }

    console.error('Error creating form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
