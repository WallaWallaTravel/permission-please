import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockPrismaClient, resetPrismaMocks, mockDataFactory } from '../helpers/mock-prisma';
import { mockTeacherSession, mockParentSession } from '../helpers/mock-session';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: mockPrismaClient,
}));

// Mock auth
const mockGetCurrentUser = vi.fn();
vi.mock('@/lib/auth/utils', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
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

describe('GET /api/forms', () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    const { GET } = await import('@/app/api/forms/route');
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request('http://localhost:6001/api/forms');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns forms for authenticated teacher', async () => {
    const { GET } = await import('@/app/api/forms/route');
    mockGetCurrentUser.mockResolvedValue(mockTeacherSession.user);

    const mockForms = [
      mockDataFactory.permissionForm({ id: 'form-1', title: 'Field Trip 1' }),
      mockDataFactory.permissionForm({ id: 'form-2', title: 'Field Trip 2' }),
    ];
    mockPrismaClient.permissionForm.findMany.mockResolvedValue(mockForms);

    const request = new Request('http://localhost:6001/api/forms');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.forms).toHaveLength(2);
  });

  it('filters forms by status query param', async () => {
    const { GET } = await import('@/app/api/forms/route');
    mockGetCurrentUser.mockResolvedValue(mockTeacherSession.user);

    mockPrismaClient.permissionForm.findMany.mockResolvedValue([]);

    const request = new Request('http://localhost:6001/api/forms?status=ACTIVE');
    await GET(request);

    expect(mockPrismaClient.permissionForm.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACTIVE',
        }),
      })
    );
  });
});

describe('POST /api/forms', () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    const { POST } = await import('@/app/api/forms/route');
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request('http://localhost:6001/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 403 when parent tries to create form', async () => {
    const { POST } = await import('@/app/api/forms/route');
    mockGetCurrentUser.mockResolvedValue(mockParentSession.user);

    const request = new Request('http://localhost:6001/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Form',
        description: 'Test',
        eventDate: '2025-06-15',
        eventType: 'FIELD_TRIP',
        deadline: '2025-06-10',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it('creates form for authenticated teacher', async () => {
    const { POST } = await import('@/app/api/forms/route');
    mockGetCurrentUser.mockResolvedValue(mockTeacherSession.user);

    // Use ISO datetime format; deadline must be before eventDate
    const formData = {
      title: 'Zoo Field Trip',
      description: 'Annual trip to the zoo',
      eventDate: '2025-06-15T09:00:00.000Z',
      eventType: 'FIELD_TRIP',
      deadline: '2025-06-10T23:59:59.000Z',
      status: 'DRAFT',
    };

    const createdForm = mockDataFactory.permissionForm({
      ...formData,
      eventDate: new Date(formData.eventDate),
      deadline: new Date(formData.deadline),
    });
    mockPrismaClient.permissionForm.create.mockResolvedValue(createdForm);

    const request = new Request('http://localhost:6001/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe('Form created successfully');
    expect(data.form.title).toBe('Zoo Field Trip');
  });

  it('validates required fields', async () => {
    const { POST } = await import('@/app/api/forms/route');
    mockGetCurrentUser.mockResolvedValue(mockTeacherSession.user);

    const request = new Request('http://localhost:6001/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '', // Empty title
        description: 'Test',
        eventDate: '2025-06-15T09:00:00.000Z',
        eventType: 'FIELD_TRIP',
        deadline: '2025-06-10T23:59:59.000Z',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('handles invalid JSON gracefully', async () => {
    const { POST } = await import('@/app/api/forms/route');
    mockGetCurrentUser.mockResolvedValue(mockTeacherSession.user);

    const request = new Request('http://localhost:6001/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid JSON');
  });
});

describe('GET /api/forms/[id]', () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  it('returns 404 when form not found', async () => {
    const { GET } = await import('@/app/api/forms/[id]/route');
    mockGetCurrentUser.mockResolvedValue(mockTeacherSession.user);
    mockPrismaClient.permissionForm.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:6001/api/forms/nonexistent');
    const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Form not found');
  });

  it('returns form for owner', async () => {
    const { GET } = await import('@/app/api/forms/[id]/route');
    mockGetCurrentUser.mockResolvedValue(mockTeacherSession.user);

    const form = mockDataFactory.permissionForm({ teacherId: mockTeacherSession.user.id });
    mockPrismaClient.permissionForm.findUnique.mockResolvedValue(form);

    const request = new NextRequest('http://localhost:6001/api/forms/form-123');
    const response = await GET(request, { params: Promise.resolve({ id: 'form-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.form).toBeDefined();
  });

  it('returns 403 when teacher accesses other teacher form', async () => {
    const { GET } = await import('@/app/api/forms/[id]/route');
    mockGetCurrentUser.mockResolvedValue(mockTeacherSession.user);

    const form = mockDataFactory.permissionForm({ teacherId: 'other-teacher-id' });
    mockPrismaClient.permissionForm.findUnique.mockResolvedValue(form);
    mockPrismaClient.formShare.findUnique.mockResolvedValue(null); // No share access

    const request = new NextRequest('http://localhost:6001/api/forms/form-123');
    const response = await GET(request, { params: Promise.resolve({ id: 'form-123' }) });

    expect(response.status).toBe(403);
  });

  it('returns 403 when a parent fetches a form by id', async () => {
    const { GET } = await import('@/app/api/forms/[id]/route');
    mockGetCurrentUser.mockResolvedValue(mockParentSession.user);

    const form = mockDataFactory.permissionForm({ teacherId: mockTeacherSession.user.id });
    mockPrismaClient.permissionForm.findUnique.mockResolvedValue(form);

    const request = new NextRequest('http://localhost:6001/api/forms/form-123');
    const response = await GET(request, { params: Promise.resolve({ id: 'form-123' }) });

    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/forms/[id]', () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  it('allows owner to delete form', async () => {
    const { DELETE } = await import('@/app/api/forms/[id]/route');
    mockGetCurrentUser.mockResolvedValue(mockTeacherSession.user);

    const form = mockDataFactory.permissionForm({ teacherId: mockTeacherSession.user.id });
    mockPrismaClient.permissionForm.findUnique.mockResolvedValue(form);
    mockPrismaClient.permissionForm.delete.mockResolvedValue(form);

    const request = new NextRequest('http://localhost:6001/api/forms/form-123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'form-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Form deleted successfully');
  });

  it('prevents non-owner from deleting form', async () => {
    const { DELETE } = await import('@/app/api/forms/[id]/route');
    mockGetCurrentUser.mockResolvedValue(mockTeacherSession.user);

    const form = mockDataFactory.permissionForm({ teacherId: 'other-teacher-id' });
    mockPrismaClient.permissionForm.findUnique.mockResolvedValue(form);

    const request = new NextRequest('http://localhost:6001/api/forms/form-123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: 'form-123' }) });

    expect(response.status).toBe(403);
  });
});

describe('GET /api/forms/[id]/export-csv', () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  const formWithSubmissions = {
    ...mockDataFactory.permissionForm({ teacherId: mockTeacherSession.user.id }),
    fields: [],
    submissions: [
      {
        id: 'sub-1',
        status: 'SIGNED' as const,
        signedAt: new Date('2026-09-01T16:00:00.000Z'),
        lastRemindedAt: null,
        parent: { id: 'p1', name: 'Priya Chen', email: 'priya@example.com' },
        student: { id: 's1', name: 'Ada Chen', grade: '4' },
        responses: [],
      },
      {
        id: 'sub-2',
        status: 'PENDING' as const,
        signedAt: null,
        lastRemindedAt: null,
        parent: { id: 'p2', name: 'Sam Ortiz', email: 'sam@example.com' },
        student: { id: 's2', name: 'Ben Ortiz', grade: '4' },
        responses: [],
      },
    ],
  };

  it('exports one row per student for trip roster view', async () => {
    const { GET } = await import('@/app/api/forms/[id]/export-csv/route');
    mockGetCurrentUser.mockResolvedValue(mockTeacherSession.user);
    mockPrismaClient.permissionForm.findUnique.mockResolvedValue(formWithSubmissions);

    const request = new NextRequest(
      'http://localhost:6001/api/forms/form-123/export-csv?view=roster'
    );
    const response = await GET(request, { params: Promise.resolve({ id: 'form-123' }) });
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/csv');
    expect(response.headers.get('Content-Disposition')).toContain('trip-roster.csv');
    expect(csv).toContain('Ada Chen');
    expect(csv).toContain('Ben Ortiz');
    expect(csv).toContain('Cleared');
    expect(csv).toContain('Awaiting');
  });

  it('exports only cleared students for the bus list', async () => {
    const { GET } = await import('@/app/api/forms/[id]/export-csv/route');
    mockGetCurrentUser.mockResolvedValue(mockTeacherSession.user);
    mockPrismaClient.permissionForm.findUnique.mockResolvedValue(formWithSubmissions);

    const request = new NextRequest(
      'http://localhost:6001/api/forms/form-123/export-csv?view=roster&status=cleared'
    );
    const response = await GET(request, { params: Promise.resolve({ id: 'form-123' }) });
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Disposition')).toContain('bus-list.csv');
    expect(csv).toContain('Ada Chen');
    expect(csv).not.toContain('Ben Ortiz');
  });

  it('returns 403 when a parent exports a roster', async () => {
    const { GET } = await import('@/app/api/forms/[id]/export-csv/route');
    mockGetCurrentUser.mockResolvedValue(mockParentSession.user);
    mockPrismaClient.permissionForm.findUnique.mockResolvedValue(formWithSubmissions);

    const request = new NextRequest(
      'http://localhost:6001/api/forms/form-123/export-csv?view=roster'
    );
    const response = await GET(request, { params: Promise.resolve({ id: 'form-123' }) });

    expect(response.status).toBe(403);
  });
});
