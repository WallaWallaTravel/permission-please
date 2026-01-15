import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Schema for linking existing parent OR creating new one
const linkParentSchema = z
  .object({
    studentId: z.string().min(1, 'Student ID is required'),
    // Either provide parentId (existing) OR parentName + parentEmail (new)
    parentId: z.string().optional(),
    parentName: z.string().min(1).max(100).optional(),
    parentEmail: z.string().email().optional(),
    relationship: z
      .enum(['parent', 'mother', 'father', 'guardian', 'grandparent'])
      .default('parent'),
  })
  .refine((data) => data.parentId || (data.parentName && data.parentEmail), {
    message: 'Either parentId or both parentName and parentEmail are required',
  });

// POST /api/students/link-parent - Link a parent to a student
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers and admins can link parents to students
    if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = linkParentSchema.parse(body);

    // Verify the student exists and get school context
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    let parentId: string;
    let isNewParent = false;

    // Case 1: Link existing parent
    if (validatedData.parentId) {
      const parent = await prisma.user.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parent) {
        return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
      }

      if (parent.role !== 'PARENT') {
        return NextResponse.json({ error: 'User is not a parent' }, { status: 400 });
      }

      parentId = parent.id;
    }
    // Case 2: Create new parent/guardian
    else if (validatedData.parentName && validatedData.parentEmail) {
      const email = validatedData.parentEmail.toLowerCase();

      // Check if user already exists with this email
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        if (existingUser.role !== 'PARENT') {
          return NextResponse.json(
            { error: 'A user with this email exists but is not a parent account' },
            { status: 400 }
          );
        }
        // Use existing parent account
        parentId = existingUser.id;
      } else {
        // Create new parent account
        const newParent = await prisma.user.create({
          data: {
            email,
            name: validatedData.parentName,
            role: 'PARENT',
            schoolId: student.schoolId,
          },
        });
        parentId = newParent.id;
        isNewParent = true;
      }
    } else {
      return NextResponse.json(
        { error: 'Either parentId or both parentName and parentEmail are required' },
        { status: 400 }
      );
    }

    // Check if link already exists
    const existingLink = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId: validatedData.studentId,
        },
      },
    });

    if (existingLink) {
      // Update relationship type if it changed
      if (existingLink.relationship !== validatedData.relationship) {
        const updatedLink = await prisma.parentStudent.update({
          where: {
            parentId_studentId: {
              parentId,
              studentId: validatedData.studentId,
            },
          },
          data: {
            relationship: validatedData.relationship,
          },
        });

        return NextResponse.json({
          message: 'Parent-student relationship updated',
          link: updatedLink,
        });
      }

      return NextResponse.json(
        { error: 'This parent is already linked to this student' },
        { status: 400 }
      );
    }

    // Create the parent-student link
    const link = await prisma.parentStudent.create({
      data: {
        parentId,
        studentId: validatedData.studentId,
        relationship: validatedData.relationship,
      },
    });

    logger.info('Parent linked to student', {
      parentId,
      studentId: validatedData.studentId,
      relationship: validatedData.relationship,
      linkedBy: session.user.id,
      isNewParent,
    });

    return NextResponse.json({
      message: isNewParent
        ? 'New guardian created and linked to student successfully'
        : 'Parent linked to student successfully',
      link,
      isNewParent,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as unknown as { issues: unknown[] };
      return NextResponse.json(
        { error: 'Validation error', details: zodError.issues },
        { status: 400 }
      );
    }

    logger.error('Error linking parent to student', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
