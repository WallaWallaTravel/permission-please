import { z } from 'zod';

/**
 * Environment variable validation schema
 * Validates all required environment variables at startup
 * to catch configuration issues early
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // NextAuth
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // Email (optional in development)
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Rate limiting (optional, with defaults)
  RATE_LIMIT_MAX: z.coerce.number().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(60000),
});

export type Env = z.infer<typeof envSchema>;

// Known insecure secrets that must not be used in production
const INSECURE_SECRETS = [
  'development-secret-change-in-production',
  'development-secret-min-32-characters-long',
  'your-secret-key-here-min-32-characters',
];

/**
 * Validates environment variables and returns typed env object
 * Throws detailed errors if validation fails
 */
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues.map((err) => {
      return `  - ${err.path.join('.')}: ${err.message}`;
    });

    console.error('❌ Environment validation failed:');
    console.error(errors.join('\n'));
    console.error('\nPlease check your .env file and ensure all required variables are set.');

    // In production, fail fast
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed');
    }

    // In development, use fallbacks but warn
    console.warn('\n⚠️ Using fallback values for development...\n');

    return {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/permission_please',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:6001',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'development-secret-min-32-characters-long',
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      FROM_EMAIL: process.env.FROM_EMAIL,
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100,
      RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    };
  }

  // In production, verify NEXTAUTH_SECRET is not a known insecure value
  if (process.env.NODE_ENV === 'production') {
    const secret = result.data.NEXTAUTH_SECRET;
    if (INSECURE_SECRETS.some((insecure) => secret.includes(insecure))) {
      throw new Error(
        '🔐 SECURITY ERROR: NEXTAUTH_SECRET contains an insecure development value. ' +
          'Generate a secure secret with: openssl rand -base64 32'
      );
    }
  }

  return result.data;
}

export const env = validateEnv();

/**
 * Check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if we're in test
 */
export const isTest = env.NODE_ENV === 'test';
