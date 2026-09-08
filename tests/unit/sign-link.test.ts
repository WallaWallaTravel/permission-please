import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient, resetPrismaMocks } from '../helpers/mock-prisma';

vi.mock('@/lib/db', () => ({
  prisma: mockPrismaClient,
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('upsertSignLink', () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  it('reuses an unexpired token instead of rotating it', async () => {
    const { upsertSignLink } = await import('@/lib/tokens/sign-link');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    mockPrismaClient.formSignLink.findUnique.mockResolvedValue({
      id: 'link-1',
      token: 'existing-token',
      formId: 'form-1',
      parentId: 'parent-1',
      expiresAt,
    });

    const token = await upsertSignLink('form-1', 'parent-1', expiresAt);

    expect(token).toBe('existing-token');
    expect(mockPrismaClient.formSignLink.upsert).not.toHaveBeenCalled();
  });

  it('rotates a token after it expires', async () => {
    const { upsertSignLink } = await import('@/lib/tokens/sign-link');
    mockPrismaClient.formSignLink.findUnique.mockResolvedValue({
      id: 'link-1',
      token: 'old-token',
      formId: 'form-1',
      parentId: 'parent-1',
      expiresAt: new Date(Date.now() - 1000),
    });
    mockPrismaClient.formSignLink.upsert.mockResolvedValue({ token: 'new-token' });

    const token = await upsertSignLink('form-1', 'parent-1', new Date(Date.now() + 86400000));

    expect(token).toBe('new-token');
    expect(mockPrismaClient.formSignLink.upsert).toHaveBeenCalled();
  });
});
