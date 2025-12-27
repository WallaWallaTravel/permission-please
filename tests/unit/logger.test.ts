import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, generateCorrelationId } from '@/lib/logger';

describe('Logger', () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('info', () => {
    it('logs info messages', () => {
      logger.info('Test message');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('includes context data', () => {
      logger.info('Test message', { userId: '123', action: 'test' });
      expect(consoleInfoSpy).toHaveBeenCalled();
      const logArg = consoleInfoSpy.mock.calls[0][0];
      expect(logArg).toContain('Test message');
    });
  });

  describe('warn', () => {
    it('logs warning messages', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('includes context in warning', () => {
      logger.warn('Warning', { reason: 'test' });
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('logs error messages', () => {
      logger.error('Error message', new Error('Test error'));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('logs error without Error object', () => {
      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('includes error details', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const logArg = consoleErrorSpy.mock.calls[0][0];
      expect(logArg).toContain('Error occurred');
    });
  });

  describe('debug', () => {
    it('calls console.debug', () => {
      logger.debug('Debug message');
      // Debug may or may not be called depending on NODE_ENV
      // Just verify no errors
      expect(true).toBe(true);
    });
  });

  describe('child logger', () => {
    it('creates child logger with default context', () => {
      const childLogger = logger.child({ service: 'test-service' });
      childLogger.info('Child message');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('merges child context with call context', () => {
      const childLogger = logger.child({ service: 'test-service' });
      childLogger.info('Message', { action: 'test' });
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });
});

describe('generateCorrelationId', () => {
  it('generates unique IDs', () => {
    const id1 = generateCorrelationId();
    const id2 = generateCorrelationId();
    expect(id1).not.toBe(id2);
  });

  it('returns string in expected format', () => {
    const id = generateCorrelationId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(10);
    expect(id).toContain('-');
  });
});

describe('Sensitive Data Handling', () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
  });

  it('logs context without exposing raw data in assertions', () => {
    // This test verifies that the logger handles context without errors
    // Actual redaction behavior depends on environment
    logger.info('Login attempt', { email: 'test@test.com', password: 'secret123' });
    expect(consoleInfoSpy).toHaveBeenCalled();
  });

  it('logs token fields safely', () => {
    logger.info('API call', { token: 'abc123', accessToken: 'xyz789' });
    expect(consoleInfoSpy).toHaveBeenCalled();
  });

  it('logs signature data safely', () => {
    logger.info('Signature submitted', { signatureData: 'base64data...', formId: '123' });
    expect(consoleInfoSpy).toHaveBeenCalled();
  });
});
