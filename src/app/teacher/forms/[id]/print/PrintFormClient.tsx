'use client';

import { useRouter } from 'next/navigation';

interface PrintFormClientProps {
  formId: string;
}

export function PrintFormClient({ formId }: PrintFormClientProps) {
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="no-print sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <button
          onClick={() => router.push(`/teacher/forms/${formId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Form
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Print-friendly version</span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
