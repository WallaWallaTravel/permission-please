import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { ParentIdentityError, resolveOrCreateParent } from '@/lib/auth/parent-identity';

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
    const { data, schoolId: requestedSchoolId } = body;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    let schoolId: string | null = requestedSchoolId || null;
    if (user.role === 'ADMIN') {
      if (!user.schoolId) {
        return NextResponse.json({ error: 'User must be assigned to a school' }, { status: 403 });
      }
      schoolId = user.schoolId;
    }

    if (!schoolId) {
      return NextResponse.json({ error: 'A school is required for import' }, { status: 400 });
    }

    // Validate school exists if provided
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const results: ImportResult[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 1;

      try {
        // Validate row data
        const validatedRow = studentRowSchema.parse(row);

        const { parent } = await resolveOrCreateParent(prisma as never, {
          email: validatedRow.parentEmail,
          name: validatedRow.parentName,
          schoolId,
        });

        const existingStudent = await prisma.student.findFirst({
          where: {
            name: validatedRow.name,
            schoolId,
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
              schoolId,
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
        } else if (error instanceof ParentIdentityError) {
          results.push({
            success: false,
            row: rowNum,
            error: error.message,
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
          schoolId,
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
