'use client';

import { useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function TryAgainButton({ onReset }: { onReset: () => void }) {
  const handleClick = useCallback(() => {
    onReset();
  }, [onReset]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
    >
      <RefreshCw className="h-4 w-4" aria-hidden="true" />
      Try Again
    </button>
  );
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error, {
      tags: { errorBoundary: 'route' },
      extra: { digest: error.digest },
    });
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden="true" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong</h1>

        <p className="mb-6 text-gray-600">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>

        {/* Error details in development */}
        {process.env.NODE_ENV === 'development' && error?.message && (
          <details className="mb-6 rounded-lg bg-gray-50 p-4 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">
              Error Details
            </summary>
            <pre className="mt-2 overflow-auto text-xs text-red-600">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <TryAgainButton onReset={reset} />

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Go Home
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          If this problem persists, please contact your school administrator.
        </p>
      </div>
    </div>
  );
}
