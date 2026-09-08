import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const authOptions: NextAuthOptions = {
  // Using JWT sessions only - no adapter needed
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow linking existing accounts by email
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Only allow sign in if user already exists in database (invite-only)
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            logger.warn('Google sign-in rejected: no account found', {
              email: user.email,
            });
            return '/login?error=NoAccount';
          }

          logger.info('Google sign-in successful', {
            email: user.email,
            userId: existingUser.id,
          });
        } catch (error) {
          logger.error(
            'Database error during sign-in',
            error instanceof Error ? error : new Error('Unknown error'),
            { email: user.email }
          );
          return '/login?error=DatabaseError';
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      try {
        if (account && user?.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true, schoolId: true },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.schoolId = dbUser.schoolId;
          } else {
            logger.warn('User not found in JWT callback', { email: user.email });
          }
          return token;
        }

        if (token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true, role: true, schoolId: true },
          });

          if (!dbUser) {
            const cleared = token as { id?: string; role?: string; schoolId?: string | null };
            cleared.id = undefined;
            cleared.role = undefined;
            cleared.schoolId = undefined;
          } else {
            token.role = dbUser.role;
            token.schoolId = dbUser.schoolId;
          }
        }
      } catch (error) {
        logger.error(
          'Database error in JWT callback',
          error instanceof Error ? error : new Error('Unknown error'),
          { email: user?.email }
        );
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.schoolId = token.schoolId as string | null;
      }
      return session;
    },
  },
};
