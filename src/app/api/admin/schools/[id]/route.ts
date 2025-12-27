import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateSchoolSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subdomain: z
    .string()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/)
    .optional(),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/schools/[id] - Get a specific school
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            forms: true,
          },
        },
        users: {
          take: 10,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    return NextResponse.json({ school });
  } catch (error) {
    console.error('Error fetching school:', error);
    return NextResponse.json({ error: 'Failed to fetch school' }, { status: 500 });
  }
}

// PATCH /api/admin/schools/[id] - Update a school
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingSchool = await prisma.school.findUnique({
      where: { id },
    });

    if (!existingSchool) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateSchoolSchema.parse(body);

    // If subdomain is being changed, check for conflicts
    if (validatedData.subdomain && validatedData.subdomain !== existingSchool.subdomain) {
      const conflictingSchool = await prisma.school.findUnique({
        where: { subdomain: validatedData.subdomain },
      });

      if (conflictingSchool) {
        return NextResponse.json(
          { error: 'A school with this subdomain already exists' },
          { status: 409 }
        );
      }
    }

    const school = await prisma.school.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.subdomain && { subdomain: validatedData.subdomain.toLowerCase() }),
        ...(validatedData.logoUrl !== undefined && { logoUrl: validatedData.logoUrl }),
        ...(validatedData.primaryColor !== undefined && {
          primaryColor: validatedData.primaryColor,
        }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
    });

    return NextResponse.json({
      message: 'School updated successfully',
      school,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating school:', error);
    return NextResponse.json({ error: 'Failed to update school' }, { status: 500 });
  }
}

// DELETE /api/admin/schools/[id] - Delete a school
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingSchool = await prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            forms: true,
          },
        },
      },
    });

    if (!existingSchool) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Prevent deletion if school has associated data
    const totalAssociations =
      existingSchool._count.users + existingSchool._count.students + existingSchool._count.forms;

    if (totalAssociations > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete school with associated users, students, or forms. Deactivate it instead.',
          counts: existingSchool._count,
        },
        { status: 400 }
      );
    }

    await prisma.school.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json({ error: 'Failed to delete school' }, { status: 500 });
  }
}
