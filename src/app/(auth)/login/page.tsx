'use client';

import { signIn, useSession } from 'next-auth/react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type LoginMode = 'google' | 'magic-link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('google');

  // Get callback URL and error from query params
  const callbackUrl = searchParams.get('callbackUrl');
  const urlError = searchParams.get('error');

  // Handle errors from OAuth redirect
  useEffect(() => {
    if (urlError === 'NoAccount') {
      setError('No account found for this email. Please contact your school administrator to get an invite.');
    } else if (urlError === 'OAuthAccountNotLinked') {
      setError('This email is already associated with another sign-in method. Try using a magic link instead.');
      setLoginMode('magic-link');
    } else if (urlError === 'DatabaseError') {
      setError('Unable to connect to the database. Please try again in a few moments.');
    } else if (urlError) {
      setError('Something went wrong. Please try again.');
    }
  }, [urlError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const destination =
        callbackUrl ||
        (session.user.role === 'PARENT' ? '/parent/dashboard' : '/teacher/dashboard');
      router.push(destination);
    }
  }, [status, session, router, callbackUrl]);

  const handleGoogleLogin = () => {
    setError('');
    setIsLoading(true);
    signIn('google', {
      callbackUrl: callbackUrl || '/teacher/dashboard',
    });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send magic link');
      } else {
        setSuccess('Check your email! If you have an account, you will receive a login link shortly.');
        setEmail('');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 transition hover:text-slate-900"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <span className="text-5xl">📝</span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">Welcome Back</h1>
            <p className="mt-2 text-slate-600">Sign in to your account</p>
          </div>

          {/* Login Mode Toggle */}
          <div className="mb-6 flex rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setLoginMode('google');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                loginMode === 'google'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('magic-link');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                loginMode === 'magic-link'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Login Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
              >
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {loginMode === 'google' ? (
              <div className="space-y-6">
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-sm text-blue-700">
                    Sign in with your Google account. This is the recommended method for most users.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-slate-700" />
                  ) : (
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
                  )}
                  {isLoading ? 'Signing in...' : 'Continue with Google'}
                </button>

                <p className="text-center text-xs text-slate-500">
                  Your school may use Google Workspace. Use your school Google account if you have one.
                </p>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-6">
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-sm text-blue-700">
                    <strong>Alternative login:</strong> Enter your email to receive a secure login link. No password needed!
                  </p>
                </div>

                {success && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="rounded-lg border border-green-200 bg-green-50 px-4 py-3"
                  >
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="magic-email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email Address
                  </label>
                  <input
                    id="magic-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-600 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="your.email@school.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send Magic Link'}
                </button>

                <p className="text-center text-xs text-slate-500">
                  We&apos;ll send a secure link to your email. The link expires in 15 minutes.
                </p>
              </form>
            )}
          </div>

          {/* Help Text */}
          <p className="mt-8 text-center text-sm text-slate-600">
            Don&apos;t have an account? Contact your school administrator to get an invite.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
