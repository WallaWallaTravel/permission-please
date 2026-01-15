import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient, resetPrismaMocks } from '../helpers/mock-prisma';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: mockPrismaClient,
}));

describe('GET /api/health', () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  it('returns healthy status when database is connected', async () => {
    const { GET } = await import('@/app/api/health/route');
    mockPrismaClient.user.count.mockResolvedValue(5);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.checks.database.status).toBe('up');
    expect(data.checks.memory).toBeDefined();
    expect(data.uptime).toBeGreaterThanOrEqual(0);
    expect(data.timestamp).toBeDefined();
  });

  it('returns unhealthy status when database is down', async () => {
    const { GET } = await import('@/app/api/health/route');
    mockPrismaClient.user.count.mockRejectedValue(new Error('Connection refused'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
    expect(data.checks.database.status).toBe('down');
    expect(data.checks.database.error).toContain('Connection refused');
  });

  it('includes database latency in response', async () => {
    const { GET } = await import('@/app/api/health/route');
    mockPrismaClient.user.count.mockResolvedValue(5);

    const response = await GET();
    const data = await response.json();

    expect(data.checks.database.latencyMs).toBeDefined();
    expect(typeof data.checks.database.latencyMs).toBe('number');
  });

  it('includes memory metrics', async () => {
    const { GET } = await import('@/app/api/health/route');
    mockPrismaClient.user.count.mockResolvedValue(5);

    const response = await GET();
    const data = await response.json();

    expect(data.checks.memory.usedMB).toBeGreaterThan(0);
    expect(data.checks.memory.totalMB).toBeGreaterThan(0);
    expect(data.checks.memory.percentUsed).toBeGreaterThanOrEqual(0);
    expect(data.checks.memory.percentUsed).toBeLessThanOrEqual(100);
  });

  it('includes version info', async () => {
    const { GET } = await import('@/app/api/health/route');
    mockPrismaClient.user.count.mockResolvedValue(5);

    const response = await GET();
    const data = await response.json();

    expect(data.version).toBeDefined();
  });
});

describe('HEAD /api/health', () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  it('returns 200 when healthy', async () => {
    const { HEAD } = await import('@/app/api/health/route');
    mockPrismaClient.$queryRaw.mockResolvedValue([{ result: 1 }]);

    const response = await HEAD();

    expect(response.status).toBe(200);
  });

  it('returns 503 when database is down', async () => {
    const { HEAD } = await import('@/app/api/health/route');
    mockPrismaClient.$queryRaw.mockRejectedValue(new Error('Connection refused'));

    const response = await HEAD();

    expect(response.status).toBe(503);
  });
});
