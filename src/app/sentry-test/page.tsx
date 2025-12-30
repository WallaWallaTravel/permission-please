'use client';

import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';

export default function SentryTestPage() {
  const [status, setStatus] = useState<string>('');

  const triggerError = () => {
    setStatus('Sending error to Sentry...');
    try {
      // Capture a test error directly
      Sentry.captureException(new Error('Test error from Sentry test page'));
      setStatus('✅ Error sent to Sentry! Check your dashboard.');
    } catch (e) {
      setStatus('❌ Failed to send error');
    }
  };

  const triggerRealError = () => {
    setStatus('Triggering real error...');
    throw new Error('Real unhandled error for Sentry test');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">Sentry Test Page</h1>
        <p className="mb-6 text-slate-600">Click a button to trigger a test error</p>
        <div className="flex flex-col gap-4">
          <button
            onClick={triggerError}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Send Test Error (Safe)
          </button>
          <button
            onClick={triggerRealError}
            className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-700"
          >
            Trigger Real Error (Crashes Page)
          </button>
        </div>
        {status && <p className="mt-6 text-sm font-medium text-slate-700">{status}</p>}
      </div>
    </div>
  );
}
