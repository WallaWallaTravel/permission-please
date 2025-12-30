import * as Sentry from '@sentry/nextjs';

// Only initialize Sentry if DSN is configured
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session replay for debugging
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Environment
    environment: process.env.NODE_ENV,

    // Release tracking (set by Vercel automatically)
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    // Enable debug in development
    debug: process.env.NODE_ENV === 'development',

    // Filter out known non-critical errors
    beforeSend(event) {
      // Ignore user aborted requests
      if (event.exception?.values?.[0]?.value?.includes('AbortError')) {
        return null;
      }
      return event;
    },

    integrations: [
      Sentry.replayIntegration({
        // Mask all text and inputs for privacy (FERPA compliance)
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
  });
}
