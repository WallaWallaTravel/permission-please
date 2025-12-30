'use client';

export default function SentryTestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">Sentry Test Page</h1>
        <p className="mb-6 text-slate-600">Click the button to trigger a test error</p>
        <button
          onClick={() => {
            // @ts-expect-error - Intentional error for Sentry test
            myUndefinedFunction();
          }}
          className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-700"
        >
          Trigger Test Error
        </button>
      </div>
    </div>
  );
}
