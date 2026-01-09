'use client';

import { useState, useEffect, use } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle, Building2, Mail } from 'lucide-react';

interface InviteData {
  email: string;
  role: string;
  school: {
    name: string;
    subdomain: string;
  } | null;
}

type PageState = 'loading' | 'error' | 'form' | 'success';

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    async function validateInvite() {
      try {
        const response = await fetch(`/api/invite/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Invalid or expired invite');
          setPageState('error');
        } else {
          setInvite(data.invite);
          setPageState('form');
        }
      } catch {
        setError('Failed to validate invite');
        setPageState('error');
      }
    }

    validateInvite();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/invite/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to accept invite');
        setIsSubmitting(false);
      } else {
        setPageState('success');
      }
    } catch {
      setError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', {
      callbackUrl: invite?.role === 'PARENT' ? '/parent/dashboard' : '/teacher/dashboard',
    });
  };

  const handleMagicLink = async () => {
    if (!invite?.email) return;

    setIsSendingMagicLink(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: invite.email }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to send magic link');
      } else {
        setMagicLinkSent(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Invalid Invite</h1>
          <p className="mb-6 text-gray-600">{error}</p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-gray-100 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-green-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Account Created!</h1>
          <p className="mb-6 text-center text-gray-600">
            Your account has been set up. Now sign in to get started.
          </p>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {magicLinkSent ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <Mail className="mx-auto mb-2 h-6 w-6 text-green-600" />
              <p className="font-medium text-green-700">Magic link sent!</p>
              <p className="mt-1 text-sm text-green-600">
                Check your email at <strong>{invite?.email}</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Google Sign-In */}
              <button
                onClick={handleGoogleSignIn}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">or</span>
                </div>
              </div>

              {/* Magic Link */}
              <button
                onClick={handleMagicLink}
                disabled={isSendingMagicLink}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isSendingMagicLink ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Send Magic Link to {invite?.email}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 text-4xl">📝</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">You&apos;re Invited!</h1>
          <p className="text-gray-600">Complete your account setup for Permission Please</p>
        </div>

        {invite?.school && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <Building2 className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600">Joining</p>
              <p className="font-medium text-blue-900">{invite.school.name}</p>
            </div>
          </div>
        )}

        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span className="font-medium">{invite?.email}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-gray-500">Role</span>
            <span className="font-medium capitalize">{invite?.role.toLowerCase()}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="John Smith"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
