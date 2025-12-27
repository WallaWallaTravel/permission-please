import { vi } from 'vitest';

/**
 * Mock Prisma Client for testing
 * Use this to mock database operations in unit tests
 */
export const mockPrismaClient = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  permissionForm: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  formSubmission: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
  },
  student: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  parentStudent: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  formField: {
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  fieldResponse: {
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $queryRaw: vi.fn(),
};

// Helper to reset all mocks
export function resetPrismaMocks() {
  Object.values(mockPrismaClient).forEach((model) => {
    if (typeof model === 'object') {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && 'mockReset' in method) {
          (method as ReturnType<typeof vi.fn>).mockReset();
        }
      });
    }
  });
}

// Mock factory for common data structures
export const mockDataFactory = {
  user: (overrides = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'PARENT',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  teacher: (overrides = {}) => ({
    id: 'teacher-123',
    email: 'teacher@school.edu',
    name: 'Test Teacher',
    role: 'TEACHER',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  parent: (overrides = {}) => ({
    id: 'parent-123',
    email: 'parent@example.com',
    name: 'Test Parent',
    role: 'PARENT',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  student: (overrides = {}) => ({
    id: 'student-123',
    name: 'Test Student',
    grade: '3rd',
    schoolId: 'school-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  permissionForm: (overrides = {}) => ({
    id: 'form-123',
    title: 'Zoo Field Trip',
    description: 'Annual trip to the city zoo',
    eventDate: new Date('2024-06-15'),
    eventType: 'FIELD_TRIP',
    deadline: new Date('2024-06-10'),
    status: 'ACTIVE',
    teacherId: 'teacher-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  formSubmission: (overrides = {}) => ({
    id: 'submission-123',
    formId: 'form-123',
    parentId: 'parent-123',
    studentId: 'student-123',
    signatureData: 'data:image/png;base64,...',
    status: 'SIGNED',
    signedAt: new Date(),
    ipAddress: '192.168.1.xxx',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  parentStudent: (overrides = {}) => ({
    parentId: 'parent-123',
    studentId: 'student-123',
    relationship: 'PARENT',
    createdAt: new Date(),
    ...overrides,
  }),

  formField: (overrides = {}) => ({
    id: 'field-123',
    formId: 'form-123',
    fieldType: 'text',
    label: 'Emergency Contact',
    required: true,
    order: 1,
    options: null,
    createdAt: new Date(),
    ...overrides,
  }),
};

export type MockPrismaClient = typeof mockPrismaClient;
