'use client';

import { use } from 'react';
import { SignFormClient } from '@/components/signatures/SignFormClient';

export default function SignFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <SignFormClient
      loadUrl={`/api/forms/${id}/sign`}
      submitUrl={`/api/forms/${id}/sign`}
      homeHref="/parent/dashboard"
      homeLabel="Return to Dashboard"
      doneHref="/parent/dashboard?signed=true"
    />
  );
}
