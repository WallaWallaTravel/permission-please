'use client';

import { useState } from 'react';
import { DistributeModal } from './DistributeModal';

interface DistributeButtonProps {
  formId: string;
}

export function DistributeButton({ formId }: DistributeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    // Refresh page after successful distribution
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        Send to Parents
      </button>

      <DistributeModal
        formId={formId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
