import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const studentRowSchema = z.object({
  name: z.string().min(1, 'Student name is required'),
  grade: z.string().min(1, 'Grade is required'),
  parentName: z.string().min(1, 'Parent name is required'),
  parentEmail: z.string().email('Invalid parent email'),
  relationship: z.string().optional().default('Parent'),
});

// Type inferred from schema for documentation purposes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type StudentRow = z.infer<typeof studentRowSchema>;

interface ImportResult {
  success: boolean;
  row: number;
  studentName?: string;
  parentEmail?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { data, schoolId } = body;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    // Validate school exists if provided
    if (schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
      });
      if (!school) {
        return NextResponse.json({ error: 'School not found' }, { status: 404 });
      }
    }

    const results: ImportResult[] = [];
    const defaultPassword = await bcrypt.hash('Welcome123!', 12);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 1;

      try {
        // Validate row data
        const validatedRow = studentRowSchema.parse(row);

        // Check if parent already exists
        let parent = await prisma.user.findUnique({
          where: { email: validatedRow.parentEmail },
        });

        if (!parent) {
          // Create parent with default password
          parent = await prisma.user.create({
            data: {
              email: validatedRow.parentEmail,
              name: validatedRow.parentName,
              password: defaultPassword,
              role: 'PARENT',
              schoolId: schoolId || null,
            },
          });
        }

        // Check if student already exists (by name + school)
        const existingStudent = await prisma.student.findFirst({
          where: {
            name: validatedRow.name,
            schoolId: schoolId || null,
          },
        });

        let student;
        if (existingStudent) {
          student = existingStudent;
        } else {
          // Create student
          student = await prisma.student.create({
            data: {
              name: validatedRow.name,
              grade: validatedRow.grade,
              schoolId: schoolId || null,
            },
          });
        }

        // Link parent to student if not already linked
        const existingLink = await prisma.parentStudent.findUnique({
          where: {
            parentId_studentId: {
              parentId: parent.id,
              studentId: student.id,
            },
          },
        });

        if (!existingLink) {
          await prisma.parentStudent.create({
            data: {
              parentId: parent.id,
              studentId: student.id,
              relationship: validatedRow.relationship || 'Parent',
            },
          });
        }

        results.push({
          success: true,
          row: rowNum,
          studentName: validatedRow.name,
          parentEmail: validatedRow.parentEmail,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          results.push({
            success: false,
            row: rowNum,
            error: error.issues.map((i) => i.message).join(', '),
          });
        } else {
          results.push({
            success: false,
            row: rowNum,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    // Log the import action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'BULK_IMPORT_STUDENTS',
        entity: 'Student',
        metadata: {
          totalRows: data.length,
          successCount,
          errorCount,
          schoolId: schoolId || null,
        },
      },
    });

    return NextResponse.json({
      message: `Import completed: ${successCount} successful, ${errorCount} errors`,
      successCount,
      errorCount,
      results,
    });
  } catch (error) {
    logger.error('Error during import', error as Error);
    return NextResponse.json({ error: 'Failed to process import' }, { status: 500 });
  }
}
