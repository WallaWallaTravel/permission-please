import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const createSchoolSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  subdomain: z
    .string()
    .min(2, 'Subdomain must be at least 2 characters')
    .max(63, 'Subdomain must be less than 63 characters')
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      'Subdomain must be lowercase alphanumeric with optional hyphens'
    ),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
    .optional()
    .nullable(),
});

// GET /api/admin/schools - List all schools
export async function GET(request: NextRequest) {
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

    const schools = await prisma.school.findMany({
      orderBy: { name: 'asc' },
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

    return NextResponse.json({ schools });
  } catch (error) {
    logger.error('Error fetching schools', error as Error);
    return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 });
  }
}

// POST /api/admin/schools - Create a new school
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createSchoolSchema.parse(body);

    // Check if subdomain already exists
    const existingSchool = await prisma.school.findUnique({
      where: { subdomain: validatedData.subdomain },
    });

    if (existingSchool) {
      return NextResponse.json(
        { error: 'A school with this subdomain already exists' },
        { status: 409 }
      );
    }

    const school = await prisma.school.create({
      data: {
        name: validatedData.name,
        subdomain: validatedData.subdomain.toLowerCase(),
        logoUrl: validatedData.logoUrl,
        primaryColor: validatedData.primaryColor,
      },
    });

    return NextResponse.json(
      {
        message: 'School created successfully',
        school,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error creating school', error as Error);
    return NextResponse.json({ error: 'Failed to create school' }, { status: 500 });
  }
}
