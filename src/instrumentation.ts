/**
 * Next.js Instrumentation
 *
 * This file runs once when the server starts.
 * It's used to initialize Sentry on the server side.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry initialization
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry initialization
    await import('../sentry.edge.config');
  }
}
