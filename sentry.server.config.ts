import * as Sentry from '@sentry/nextjs';

// Only initialize Sentry if DSN is configured
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Environment
    environment: process.env.NODE_ENV,

    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    // Enable debug in development
    debug: process.env.NODE_ENV === 'development',

    // Filter sensitive data from being sent
    beforeSend(event) {
      // Remove potentially sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      if (event.request?.headers) {
        // Keep only safe headers
        const safeHeaders = ['user-agent', 'referer', 'accept-language'];
        const filteredHeaders: Record<string, string> = {};
        for (const header of safeHeaders) {
          if (event.request.headers[header]) {
            filteredHeaders[header] = event.request.headers[header];
          }
        }
        event.request.headers = filteredHeaders;
      }
      return event;
    },
  });
}
