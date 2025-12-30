'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

// Force dynamic rendering to avoid static prerender issues
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global Error Boundary
 *
 * Minimal version that avoids onClick handlers to prevent
 * Next.js 16 static prerendering issues.
 */
export default function GlobalError({ error }: GlobalErrorProps) {
  useEffect(() => {
    // Log the critical error to Sentry
    Sentry.captureException(error, {
      tags: { errorBoundary: 'global' },
      level: 'fatal',
      extra: { digest: error.digest },
    });
    console.error('Global application error:', error);
  }, [error]);

  // Use an anchor tag instead of button to avoid onClick serialization issues
  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: 0,
          padding: '1rem',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem',
            }}
          >
            Critical Error
          </h1>
          <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
            The application encountered a critical error.
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Global error boundary cannot use Next.js Link */}
          <a
            href="/"
            style={{
              display: 'inline-block',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Return Home
          </a>
        </div>
      </body>
    </html>
  );
}
