'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteStudentButtonProps {
  studentId: string;
  studentName: string;
}

export function DeleteStudentButton({ studentId, studentName }: DeleteStudentButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${studentName}"? This will also remove any form submissions for this student.`
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete student');
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-1 text-gray-400 transition-colors hover:text-red-600 disabled:opacity-50"
      title="Delete student"
    >
      {isDeleting ? (
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
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
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      )}
    </button>
  );
}
