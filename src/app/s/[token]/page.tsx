'use client';

import { use } from 'react';
import { SignFormClient } from '@/components/signatures/SignFormClient';

export default function PublicSignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  return (
    <SignFormClient
      loadUrl={`/api/s/${token}`}
      submitUrl={`/api/s/${token}`}
      homeHref="/"
      homeLabel="Back to home"
      doneHref="/"
    />
  );
}
