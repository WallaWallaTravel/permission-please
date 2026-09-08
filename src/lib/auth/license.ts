import { AuthzError } from './school-access';

export type SchoolLicenseFields = {
  isActive: boolean;
  licensedThrough: Date | string | null;
};

export type LicenseStatus = 'licensed' | 'expired' | 'legacy' | 'inactive';

function endOfLicenseDay(value: Date | string): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}

/** Parse an HTML date input (YYYY-MM-DD) as the inclusive last licensed day. */
export function parseLicenseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}

export function licenseDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

export function schoolLicenseStatus(school: SchoolLicenseFields): LicenseStatus {
  if (!school.isActive) return 'inactive';
  if (!school.licensedThrough) return 'legacy';
  const end = endOfLicenseDay(school.licensedThrough);
  return Date.now() <= end.getTime() ? 'licensed' : 'expired';
}

export function schoolCanSend(
  school: SchoolLicenseFields | null | undefined
): { ok: true } | { ok: false; message: string } {
  if (!school) {
    return { ok: true };
  }

  const status = schoolLicenseStatus(school);

  if (status === 'inactive') {
    return { ok: false, message: 'This school is deactivated. Contact Permission Please.' };
  }

  if (status === 'expired') {
    const day = licenseDateInputValue(school.licensedThrough);
    return {
      ok: false,
      message: `This school's annual license ended on ${day}. Contact Permission Please to renew.`,
    };
  }

  return { ok: true };
}

export function assertSchoolCanSend(school: SchoolLicenseFields | null | undefined): void {
  const result = schoolCanSend(school);
  if (!result.ok) {
    throw new AuthzError(result.message, 403);
  }
}

export function licenseStatusLabel(status: LicenseStatus): string {
  if (status === 'licensed') return 'Licensed';
  if (status === 'expired') return 'Expired';
  if (status === 'inactive') return 'Inactive';
  return 'No end date';
}
