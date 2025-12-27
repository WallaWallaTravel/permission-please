import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

/**
 * Extract subdomain from hostname
 */
export function getSubdomainFromHost(host: string): string | null {
  // Handle localhost
  if (host.includes('localhost')) {
    return null;
  }

  // Remove port if present
  const hostname = host.split(':')[0];

  // Check for permissionplease.app domain
  const baseDomain = 'permissionplease.app';
  if (hostname === baseDomain || hostname === `www.${baseDomain}`) {
    return null; // Main domain, no subdomain
  }

  // Extract subdomain
  if (hostname.endsWith(`.${baseDomain}`)) {
    const subdomain = hostname.replace(`.${baseDomain}`, '');
    if (subdomain && subdomain !== 'www') {
      return subdomain;
    }
  }

  // Handle Vercel preview URLs
  if (hostname.includes('vercel.app')) {
    return null;
  }

  return null;
}

/**
 * Get the current school from request headers (set by middleware)
 */
export async function getCurrentSchool() {
  const headersList = await headers();
  const subdomain = headersList.get('x-school-subdomain');

  if (!subdomain) {
    return null;
  }

  const school = await prisma.school.findUnique({
    where: { subdomain },
  });

  return school;
}

/**
 * Get school by subdomain
 */
export async function getSchoolBySubdomain(subdomain: string) {
  return prisma.school.findUnique({
    where: { subdomain, isActive: true },
  });
}

/**
 * Get all active schools
 */
export async function getAllSchools() {
  return prisma.school.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}

/**
 * Create a new school
 */
export async function createSchool(data: {
  name: string;
  subdomain: string;
  logoUrl?: string;
  primaryColor?: string;
}) {
  // Normalize subdomain (lowercase, alphanumeric with hyphens)
  const normalizedSubdomain = data.subdomain
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return prisma.school.create({
    data: {
      name: data.name,
      subdomain: normalizedSubdomain,
      logoUrl: data.logoUrl,
      primaryColor: data.primaryColor,
    },
  });
}
