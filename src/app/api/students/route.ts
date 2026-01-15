import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const addStudentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  grade: z.string().min(1, 'Grade is required'),
  parentName: z.string().min(1, 'Parent name is required').max(100),
  parentEmail: z.string().email('Invalid parent email'),
});

// GET - List all students
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const students = await prisma.student.findMany({
      include: {
        parents: {
          include: {
            parent: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ students });
  } catch (error) {
    logger.error('Error fetching students', error as Error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

// POST - Add new student
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = addStudentSchema.parse(body);

    // Get the teacher's schoolId for multi-tenancy
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolId: true },
    });

    // Use transaction to create student and parent atomically
    const result = await prisma.$transaction(async (tx) => {
      // Check if parent already exists by email
      let parent = await tx.user.findUnique({
        where: { email: validatedData.parentEmail.toLowerCase() },
      });

      // Create parent if doesn't exist
      if (!parent) {
        parent = await tx.user.create({
          data: {
            email: validatedData.parentEmail.toLowerCase(),
            name: validatedData.parentName,
            role: 'PARENT',
            schoolId: teacher?.schoolId,
          },
        });
      }

      // Create student
      const student = await tx.student.create({
        data: {
          name: validatedData.name,
          grade: validatedData.grade,
          schoolId: teacher?.schoolId,
        },
      });

      // Link parent to student (check if link already exists)
      const existingLink = await tx.parentStudent.findUnique({
        where: {
          parentId_studentId: {
            parentId: parent.id,
            studentId: student.id,
          },
        },
      });

      if (!existingLink) {
        await tx.parentStudent.create({
          data: {
            parentId: parent.id,
            studentId: student.id,
            relationship: 'Parent/Guardian',
          },
        });
      }

      return { student, parent };
    });

    return NextResponse.json({
      success: true,
      message: 'Student and parent added successfully',
      student: result.student,
      parent: { id: result.parent.id, name: result.parent.name, email: result.parent.email },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error adding student', error as Error);
    return NextResponse.json({ error: 'Failed to add student' }, { status: 500 });
  }
}
