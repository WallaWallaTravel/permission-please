import { describe, it, expect } from 'vitest';
import {
  licenseDateInputValue,
  parseLicenseDate,
  schoolCanSend,
  schoolLicenseStatus,
} from '@/lib/auth/license';

describe('school license', () => {
  it('treats a future date as licensed', () => {
    const school = { isActive: true, licensedThrough: parseLicenseDate('2027-09-07') };
    expect(schoolLicenseStatus(school)).toBe('licensed');
    expect(schoolCanSend(school).ok).toBe(true);
  });

  it('blocks sending after the license date', () => {
    const school = { isActive: true, licensedThrough: parseLicenseDate('2020-01-01') };
    expect(schoolLicenseStatus(school)).toBe('expired');
    const blocked = schoolCanSend(school);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.message).toMatch(/ended on/);
    }
  });

  it('lets a legacy school with no end date keep sending', () => {
    const school = { isActive: true, licensedThrough: null };
    expect(schoolLicenseStatus(school)).toBe('legacy');
    expect(schoolCanSend(school).ok).toBe(true);
  });

  it('blocks a deactivated school even if the date is in the future', () => {
    const school = { isActive: false, licensedThrough: parseLicenseDate('2027-09-07') };
    expect(schoolLicenseStatus(school)).toBe('inactive');
    expect(schoolCanSend(school).ok).toBe(false);
  });

  it('allows forms with no school (legacy rows)', () => {
    expect(schoolCanSend(null).ok).toBe(true);
  });

  it('stores the license date as the end of that UTC day', () => {
    const parsed = parseLicenseDate('2026-12-31');
    expect(licenseDateInputValue(parsed)).toBe('2026-12-31');
    expect(parsed.getUTCHours()).toBe(23);
  });
});
