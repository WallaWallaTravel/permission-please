import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, rateLimitPresets, type RateLimitConfig } from '@/lib/rate-limit';

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createMockRequest = (ip = '192.168.1.1'): Request => {
    return {
      headers: {
        get: (name: string) => {
          if (name === 'x-forwarded-for') return ip;
          return null;
        },
      },
    } as unknown as Request;
  };

  it('allows requests under the limit', () => {
    const config: RateLimitConfig = { max: 5, windowMs: 60000 };
    const request = createMockRequest();

    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(request, config);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it('blocks requests over the limit', () => {
    const config: RateLimitConfig = { max: 3, windowMs: 60000 };
    const request = createMockRequest();

    // Use up all requests
    for (let i = 0; i < 3; i++) {
      checkRateLimit(request, config);
    }

    // This should be blocked
    const result = checkRateLimit(request, config);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', () => {
    const config: RateLimitConfig = { max: 2, windowMs: 60000 };
    const request = createMockRequest();

    // Use up all requests
    checkRateLimit(request, config);
    checkRateLimit(request, config);
    expect(checkRateLimit(request, config).success).toBe(false);

    // Advance time past window
    vi.advanceTimersByTime(60001);

    // Should be allowed again
    const result = checkRateLimit(request, config);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('tracks different IPs separately', () => {
    const config: RateLimitConfig = { max: 2, windowMs: 60000 };

    const request1 = createMockRequest('192.168.1.1');
    const request2 = createMockRequest('192.168.1.2');

    // User 1 uses up their limit
    checkRateLimit(request1, config);
    checkRateLimit(request1, config);
    expect(checkRateLimit(request1, config).success).toBe(false);

    // User 2 should still have their full limit
    const result = checkRateLimit(request2, config);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('skips rate limiting when skip function returns true', () => {
    const config: RateLimitConfig = {
      max: 1,
      windowMs: 60000,
      skip: () => true,
    };
    const request = createMockRequest();

    // All requests should succeed even though max is 1
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(request, config);
      expect(result.success).toBe(true);
    }
  });

  it('uses custom key generator when provided', () => {
    const config: RateLimitConfig = {
      max: 2,
      windowMs: 60000,
      keyGenerator: () => 'custom-key',
    };

    // Different IPs should share the same limit with custom key
    const request1 = createMockRequest('192.168.1.1');
    const request2 = createMockRequest('192.168.1.2');

    checkRateLimit(request1, config);
    checkRateLimit(request2, config);
    expect(checkRateLimit(request1, config).success).toBe(false);
  });
});

describe('rateLimitPresets', () => {
  it('has auth preset with appropriate limits', () => {
    expect(rateLimitPresets.auth).toBeDefined();
    expect(rateLimitPresets.auth.max).toBeLessThanOrEqual(10);
    expect(rateLimitPresets.auth.windowMs).toBeGreaterThanOrEqual(60000);
  });

  it('has api preset with appropriate limits', () => {
    expect(rateLimitPresets.api).toBeDefined();
    expect(rateLimitPresets.api.max).toBeGreaterThan(0);
  });

  it('has formSubmit preset with appropriate limits', () => {
    expect(rateLimitPresets.formSubmit).toBeDefined();
    expect(rateLimitPresets.formSubmit.max).toBeGreaterThan(0);
  });

  it('has email preset with strict limits', () => {
    expect(rateLimitPresets.email).toBeDefined();
    expect(rateLimitPresets.email.max).toBeLessThanOrEqual(10);
  });

  it('has health preset with lenient limits', () => {
    expect(rateLimitPresets.health).toBeDefined();
    expect(rateLimitPresets.health.max).toBeGreaterThan(100);
  });
});
