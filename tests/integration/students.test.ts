import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockPrismaClient, resetPrismaMocks, mockDataFactory } from '../helpers/mock-prisma';

// Define mock sessions inline to avoid hoisting issues
const mockTeacherSession = {
  user: {
    id: 'teacher-123',
    email: 'teacher@school.edu',
    name: 'Test Teacher',
    role: 'TEACHER' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const mockParentSession = {
  user: {
    id: 'parent-123',
    email: 'parent@example.com',
    name: 'Test Parent',
    role: 'PARENT' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const mockAdminSession = {
  user: {
    id: 'admin-123',
    email: 'admin@school.edu',
    name: 'Admin User',
    role: 'ADMIN' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Store current session for dynamic mocking
let currentSession: typeof mockTeacherSession | null = null;

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: mockPrismaClient,
}));

// Mock next-auth with dynamic session
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => Promise.resolve(currentSession)),
}));

// Mock auth options
vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  applyRateLimit: () => null,
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

function createNextRequest(
  url: string,
  options: { method?: string; body?: unknown } = {}
): NextRequest {
  const { method = 'GET', body } = options;
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('GET /api/students', () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
    currentSession = null;
  });

  it('returns 401 when not authenticated', async () => {
    vi.resetModules();
    currentSession = null;
    const { GET } = await import('@/app/api/students/route');

    const request = createNextRequest('http://localhost:6001/api/students');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 403 when parent tries to list students', async () => {
    vi.resetModules();
    currentSession = mockParentSession;
    const { GET } = await import('@/app/api/students/route');

    const request = createNextRequest('http://localhost:6001/api/students');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('returns students for teacher', async () => {
    vi.resetModules();
    currentSession = mockTeacherSession;
    const { GET } = await import('@/app/api/students/route');

    const mockStudents = [
      mockDataFactory.student({ id: 'student-1', name: 'Alice' }),
      mockDataFactory.student({ id: 'student-2', name: 'Bob' }),
    ];
    mockPrismaClient.student.findMany.mockResolvedValue(mockStudents);

    const request = createNextRequest('http://localhost:6001/api/students');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.students).toHaveLength(2);
  });

  it('returns students for admin', async () => {
    vi.resetModules();
    currentSession = mockAdminSession;
    const { GET } = await import('@/app/api/students/route');

    mockPrismaClient.student.findMany.mockResolvedValue([]);

    const request = createNextRequest('http://localhost:6001/api/students');
    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});

describe('POST /api/students', () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
    currentSession = null;
  });

  it('returns 401 when not authenticated', async () => {
    vi.resetModules();
    currentSession = null;
    const { POST } = await import('@/app/api/students/route');

    const request = createNextRequest('http://localhost:6001/api/students', {
      method: 'POST',
      body: { name: 'New Student', grade: '3rd' },
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 403 when parent tries to add student', async () => {
    vi.resetModules();
    currentSession = mockParentSession;
    const { POST } = await import('@/app/api/students/route');

    const request = createNextRequest('http://localhost:6001/api/students', {
      method: 'POST',
      body: { name: 'New Student', grade: '3rd' },
    });
    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  it('creates student for teacher', async () => {
    vi.resetModules();
    currentSession = mockTeacherSession;
    const { POST } = await import('@/app/api/students/route');

    const newStudent = mockDataFactory.student({ name: 'New Student', grade: '3rd' });
    const mockParent = {
      id: 'parent-new',
      name: 'Parent Name',
      email: 'parent@test.com',
      role: 'PARENT',
    };
    mockPrismaClient.user.findUnique.mockResolvedValue(null); // No existing teacher or parent
    mockPrismaClient.user.create.mockResolvedValue(mockParent);
    mockPrismaClient.student.create.mockResolvedValue(newStudent);
    mockPrismaClient.parentStudent.findUnique.mockResolvedValue(null);
    mockPrismaClient.parentStudent.create.mockResolvedValue({});
    mockPrismaClient.$transaction.mockImplementation((fn) => fn(mockPrismaClient));

    const request = createNextRequest('http://localhost:6001/api/students', {
      method: 'POST',
      body: {
        name: 'New Student',
        grade: '3rd',
        parentName: 'Parent Name',
        parentEmail: 'parent@test.com',
      },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.student.name).toBe('New Student');
  });

  it('validates required fields', async () => {
    vi.resetModules();
    currentSession = mockTeacherSession;
    const { POST } = await import('@/app/api/students/route');

    const request = createNextRequest('http://localhost:6001/api/students', {
      method: 'POST',
      body: { name: '', grade: '', parentName: '', parentEmail: '' }, // Empty required fields
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation error');
  });

  it('validates name length', async () => {
    vi.resetModules();
    currentSession = mockTeacherSession;
    const { POST } = await import('@/app/api/students/route');

    const request = createNextRequest('http://localhost:6001/api/students', {
      method: 'POST',
      body: {
        name: 'A'.repeat(101),
        grade: '3rd',
        parentName: 'Parent',
        parentEmail: 'parent@test.com',
      }, // Name too long
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('creates student for admin', async () => {
    vi.resetModules();
    currentSession = mockAdminSession;
    const { POST } = await import('@/app/api/students/route');

    const newStudent = mockDataFactory.student({ name: 'Admin Created', grade: '5th' });
    const mockParent = {
      id: 'parent-admin',
      name: 'Admin Parent',
      email: 'adminparent@test.com',
      role: 'PARENT',
    };
    mockPrismaClient.user.findUnique.mockResolvedValue(null);
    mockPrismaClient.user.create.mockResolvedValue(mockParent);
    mockPrismaClient.student.create.mockResolvedValue(newStudent);
    mockPrismaClient.parentStudent.findUnique.mockResolvedValue(null);
    mockPrismaClient.parentStudent.create.mockResolvedValue({});
    mockPrismaClient.$transaction.mockImplementation((fn) => fn(mockPrismaClient));

    const request = createNextRequest('http://localhost:6001/api/students', {
      method: 'POST',
      body: {
        name: 'Admin Created',
        grade: '5th',
        parentName: 'Admin Parent',
        parentEmail: 'adminparent@test.com',
      },
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
  });
});
