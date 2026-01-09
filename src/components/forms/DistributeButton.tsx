'use client';

import { useState } from 'react';

interface DistributeButtonProps {
  formId: string;
}

export function DistributeButton({ formId }: DistributeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleDistribute = async () => {
    if (!confirm('Send this form to all parents with linked students?')) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/forms/${formId}/distribute`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to distribute');
      }

      setResult({ success: true, message: data.message });

      // Refresh page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to distribute',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleDistribute}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Sending...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Send to Parents
          </>
        )}
      </button>

      {result && (
        <div
          className={`absolute top-full right-0 z-10 mt-2 rounded-lg px-4 py-2 text-sm whitespace-nowrap ${
            result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}

