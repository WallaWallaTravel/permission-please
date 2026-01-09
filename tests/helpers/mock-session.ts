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

// Note: Use vi.mock('next-auth', ...) directly in test files with hoisted mocks
// The mockNextAuth function was removed due to vi.mock hoisting issues

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

/**
 * Helper to create NextRequest for API route testing
 */
export function createMockNextRequest(
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    url?: string;
    searchParams?: Record<string, string>;
  } = {}
) {
  const {
    method = 'GET',
    body,
    headers = {},
    url = 'http://localhost:6001/api/test',
    searchParams = {},
  } = options;

  const urlObj = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const headersMap = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));

  return {
    method,
    url: urlObj.toString(),
    nextUrl: urlObj,
    headers: {
      get: (name: string) => headersMap.get(name.toLowerCase()) || null,
      has: (name: string) => headersMap.has(name.toLowerCase()),
      entries: () => headersMap.entries(),
      forEach: (cb: (value: string, key: string) => void) => headersMap.forEach(cb),
    },
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    ip: '127.0.0.1',
    geo: { city: 'Test City', country: 'US' },
  };
}
