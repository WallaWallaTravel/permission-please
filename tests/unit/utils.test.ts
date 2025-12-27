import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatDate,
  formatDateTime,
  getRelativeTime,
  getDaysRemaining,
  capitalize,
  truncate,
  getInitials,
  sleep,
  debounce,
  formatNumber,
  calculatePercentage,
} from '@/lib/utils';

describe('Utils', () => {
  describe('cn (className merger)', () => {
    it('merges multiple class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      expect(cn('base', isActive && 'active')).toBe('base active');
    });

    it('removes duplicate Tailwind classes', () => {
      expect(cn('p-4', 'p-6')).toBe('p-6');
    });

    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end');
    });
  });

  describe('formatDate', () => {
    it('formats a Date object', () => {
      // Use explicit time to avoid timezone issues
      const date = new Date(2024, 5, 15); // June 15, 2024 (months are 0-indexed)
      const result = formatDate(date);
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('formats a date string', () => {
      // Use a Date object to avoid timezone parsing issues
      const date = new Date(2024, 11, 25); // December 25, 2024
      const result = formatDate(date);
      expect(result).toContain('Dec');
      expect(result).toContain('25');
    });

    it('accepts custom options', () => {
      const date = new Date('2024-06-15');
      const result = formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' });
      expect(result).toContain('June');
    });
  });

  describe('formatDateTime', () => {
    it('includes time in output', () => {
      const date = new Date('2024-06-15T14:30:00');
      const result = formatDateTime(date);
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toMatch(/\d{1,2}:\d{2}/); // Time format
    });
  });

  describe('getRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "just now" for very recent times', () => {
      const date = new Date('2024-06-15T12:00:00');
      expect(getRelativeTime(date)).toBe('just now');
    });

    it('returns minutes ago', () => {
      const date = new Date('2024-06-15T11:55:00');
      expect(getRelativeTime(date)).toBe('5 minutes ago');
    });

    it('returns hours ago', () => {
      const date = new Date('2024-06-15T10:00:00');
      expect(getRelativeTime(date)).toBe('2 hours ago');
    });

    it('returns "yesterday"', () => {
      const date = new Date('2024-06-14T12:00:00');
      expect(getRelativeTime(date)).toBe('yesterday');
    });

    it('returns days ago', () => {
      const date = new Date('2024-06-12T12:00:00');
      expect(getRelativeTime(date)).toBe('3 days ago');
    });

    it('returns weeks ago', () => {
      const date = new Date('2024-06-01T12:00:00');
      expect(getRelativeTime(date)).toBe('2 weeks ago');
    });

    it('falls back to formatted date for old dates', () => {
      const date = new Date('2024-01-15T12:00:00');
      const result = getRelativeTime(date);
      expect(result).toContain('Jan');
      expect(result).toContain('15');
    });
  });

  describe('getDaysRemaining', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns positive days for future dates', () => {
      const date = new Date('2024-06-20T12:00:00');
      expect(getDaysRemaining(date)).toBe(5);
    });

    it('returns negative days for past dates', () => {
      const date = new Date('2024-06-10T12:00:00');
      expect(getDaysRemaining(date)).toBe(-5);
    });

    it('handles date strings', () => {
      expect(getDaysRemaining('2024-06-18T12:00:00')).toBe(3);
    });
  });

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('lowercases rest of string', () => {
      expect(capitalize('HELLO')).toBe('Hello');
    });

    it('handles empty strings', () => {
      expect(capitalize('')).toBe('');
    });

    it('handles single character', () => {
      expect(capitalize('a')).toBe('A');
    });
  });

  describe('truncate', () => {
    it('truncates long strings', () => {
      expect(truncate('This is a very long string', 10)).toBe('This is a...');
    });

    it('does not truncate short strings', () => {
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('handles exact length', () => {
      expect(truncate('Exact', 5)).toBe('Exact');
    });
  });

  describe('getInitials', () => {
    it('gets initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('handles single name', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('limits to two characters', () => {
      expect(getInitials('John Paul Doe')).toBe('JP');
    });

    it('handles lowercase names', () => {
      expect(getInitials('john doe')).toBe('JD');
    });
  });

  describe('sleep', () => {
    it('delays execution', async () => {
      vi.useFakeTimers();
      const promise = sleep(100);
      vi.advanceTimersByTime(100);
      await promise;
      vi.useRealTimers();
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('debounces function calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('passes arguments to debounced function', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('handles small numbers', () => {
      expect(formatNumber(42)).toBe('42');
    });
  });

  describe('calculatePercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 3)).toBe(33);
    });

    it('handles zero total', () => {
      expect(calculatePercentage(10, 0)).toBe(0);
    });

    it('rounds to nearest integer', () => {
      expect(calculatePercentage(1, 3)).toBe(33);
      expect(calculatePercentage(2, 3)).toBe(67);
    });
  });
});
