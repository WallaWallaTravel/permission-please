import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const TOKEN_BYTES = 32;

export function appBaseUrl(): string {
  return process.env.NEXTAUTH_URL || 'http://localhost:6001';
}

export function signLinkUrl(token: string): string {
  return `${appBaseUrl()}/s/${token}`;
}

export async function upsertSignLink(
  formId: string,
  parentId: string,
  expiresAt: Date
): Promise<string> {
  const existing = await prisma.formSignLink.findUnique({
    where: {
      formId_parentId: { formId, parentId },
    },
  });

  if (existing && existing.expiresAt > new Date()) {
    if (expiresAt.getTime() > existing.expiresAt.getTime()) {
      await prisma.formSignLink.update({
        where: { id: existing.id },
        data: { expiresAt },
      });
    }
    return existing.token;
  }

  const token = randomBytes(TOKEN_BYTES).toString('hex');

  const link = await prisma.formSignLink.upsert({
    where: {
      formId_parentId: { formId, parentId },
    },
    create: {
      token,
      formId,
      parentId,
      expiresAt,
    },
    update: {
      token,
      expiresAt,
    },
  });

  logger.info('Sign link upserted', { formId, parentId, rotated: Boolean(existing) });
  return link.token;
}

export async function getSignLinkByToken(token: string) {
  if (!token || token.length < 16) {
    return null;
  }

  const link = await prisma.formSignLink.findUnique({
    where: { token },
    include: {
      form: {
        include: {
          teacher: { select: { name: true, email: true } },
          school: { select: { name: true } },
          fields: { orderBy: { order: 'asc' } },
          documents: { orderBy: { order: 'asc' } },
        },
      },
      parent: {
        select: { id: true, email: true, name: true, role: true },
      },
    },
  });

  if (!link) {
    return null;
  }

  if (link.expiresAt < new Date()) {
    logger.warn('Sign link expired', { formId: link.formId, parentId: link.parentId });
    return null;
  }

  if (link.parent.role !== 'PARENT') {
    return null;
  }

  return link;
}
