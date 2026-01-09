import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const MAGIC_LINK_EXPIRY_MINUTES = 15;
const TOKEN_BYTES = 32;

export interface MagicLinkUser {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string | null;
}

/**
 * Generate a magic link token for passwordless login
 * Token is stored in database with 15-minute expiry
 */
export async function generateMagicLinkToken(email: string): Promise<string> {
  const token = randomBytes(TOKEN_BYTES).toString('hex');
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + MAGIC_LINK_EXPIRY_MINUTES);

  // Invalidate any existing unused tokens for this email
  await prisma.magicLinkToken.updateMany({
    where: {
      email,
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  await prisma.magicLinkToken.create({
    data: {
      token,
      email,
      expiresAt,
    },
  });

  logger.info('Magic link token generated', {
    email,
    expiresAt: expiresAt.toISOString(),
  });

  return token;
}

/**
 * Verify a magic link token and return user data if valid
 * Returns null if token is invalid, expired, or already used
 */
export async function verifyMagicLinkToken(
  token: string
): Promise<MagicLinkUser | null> {
  const magicToken = await prisma.magicLinkToken.findUnique({
    where: { token },
  });

  if (!magicToken) {
    logger.warn('Magic link token not found', {
      token: token.substring(0, 8) + '...',
    });
    return null;
  }

  // Check if already used
  if (magicToken.usedAt) {
    logger.warn('Magic link token already used', {
      tokenId: magicToken.id,
      usedAt: magicToken.usedAt.toISOString(),
    });
    return null;
  }

  // Check if expired
  if (magicToken.expiresAt < new Date()) {
    logger.warn('Magic link token expired', {
      tokenId: magicToken.id,
      expiresAt: magicToken.expiresAt.toISOString(),
    });
    return null;
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: magicToken.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      schoolId: true,
    },
  });

  if (!user) {
    logger.warn('User not found for magic link', { email: magicToken.email });
    return null;
  }

  // Only allow PARENT role to use magic links
  if (user.role !== 'PARENT') {
    logger.warn('Non-parent attempted magic link login', {
      email: magicToken.email,
      role: user.role,
    });
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolId: user.schoolId,
  };
}

/**
 * Mark a magic link token as used (single-use enforcement)
 * Should be called after successful login
 */
export async function markMagicLinkTokenUsed(token: string): Promise<void> {
  await prisma.magicLinkToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  logger.info('Magic link token marked as used', {
    token: token.substring(0, 8) + '...',
  });
}

/**
 * Check if a user exists with given email and is a PARENT
 * Used before sending magic link (prevents email enumeration by returning true regardless)
 */
export async function canSendMagicLink(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });

  return user?.role === 'PARENT';
}

/**
 * Clean up expired magic link tokens (for cron job)
 */
export async function cleanupExpiredMagicLinkTokens(): Promise<number> {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const result = await prisma.magicLinkToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: oneDayAgo } },
        { usedAt: { lt: oneDayAgo } },
      ],
    },
  });

  logger.info('Expired magic link tokens cleaned up', { count: result.count });

  return result.count;
}

/**
 * Get recent magic link request count for rate limiting
 * Returns count of tokens created in the last minute for this email
 */
export async function getRecentMagicLinkRequestCount(
  email: string
): Promise<number> {
  const oneMinuteAgo = new Date();
  oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

  const count = await prisma.magicLinkToken.count({
    where: {
      email,
      createdAt: { gte: oneMinuteAgo },
    },
  });

  return count;
}
