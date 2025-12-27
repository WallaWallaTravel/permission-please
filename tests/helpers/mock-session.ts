import { vi } from 'vitest';

/**
 * Mock session data for testing authenticated routes
 */
export const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'PARENT' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
};

export const mockTeacherSession = {
  user: {
    id: 'teacher-123',
    email: 'teacher@school.edu',
    name: 'Test Teacher',
    role: 'TEACHER' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockParentSession = {
  user: {
    id: 'parent-123',
    email: 'parent@example.com',
    name: 'Test Parent',
    role: 'PARENT' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockAdminSession = {
  user: {
    id: 'admin-123',
    email: 'admin@school.edu',
    name: 'Admin User',
    role: 'ADMIN' as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * Create a mock getServerSession function
 */
export function createMockGetServerSession(session: typeof mockSession | null = mockSession) {
  return vi.fn().mockResolvedValue(session);
}

/**
 * Mock next-auth module
 */
export function mockNextAuth(session: typeof mockSession | null = mockSession) {
  vi.mock('next-auth', () => ({
    getServerSession: vi.fn().mockResolvedValue(session),
  }));
}

/**
 * Helper to create request with headers
 */
export function createMockRequest(
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    url?: string;
  } = {}
) {
  const { method = 'GET', body, headers = {}, url = 'http://localhost:3000/api/test' } = options;

  return {
    method,
    url,
    headers: {
      get: (name: string) => headers[name.toLowerCase()] || null,
    },
    json: vi.fn().mockResolvedValue(body),
    ip: '127.0.0.1',
  } as unknown as Request;
}
