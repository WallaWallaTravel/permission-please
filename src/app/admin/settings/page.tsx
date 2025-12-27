'use client';

import { useState } from 'react';
import { Mail, Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: 'Test email sent successfully! Check your inbox.' });
      } else {
        setResult({ success: false, message: data.error || 'Failed to send test email' });
      }
    } catch {
      setResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">Configure your Permission Please instance</p>
      </div>

      {/* Email Configuration */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Email Configuration</h2>
            <p className="text-sm text-gray-500">Configure email notifications via Resend</p>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-2 font-medium text-amber-800">Setup Instructions</h3>
          <ol className="list-inside list-decimal space-y-2 text-sm text-amber-700">
            <li>
              Create a free account at{' '}
              <a
                href="https://resend.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline"
              >
                resend.com <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>Add and verify your domain (permissionplease.app)</li>
            <li>Create an API key in the Resend dashboard</li>
            <li>
              Add the API key to Vercel:{' '}
              <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code>
            </li>
            <li>
              Optionally set <code className="rounded bg-amber-100 px-1">FROM_EMAIL</code> (default:
              noreply@permissionplease.app)
            </li>
          </ol>
        </div>

        {/* Test Email */}
        <form onSubmit={handleSendTest} className="space-y-4">
          <div>
            <label htmlFor="testEmail" className="mb-1 block text-sm font-medium text-gray-700">
              Send Test Email
            </label>
            <div className="flex gap-3">
              <input
                type="email"
                id="testEmail"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Test'
                )}
              </button>
            </div>
          </div>

          {result && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 ${
                result.success
                  ? 'border border-green-200 bg-green-50 text-green-700'
                  : 'border border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {result.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              {result.message}
            </div>
          )}
        </form>
      </div>

      {/* Email Templates Info */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Email Templates</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 py-2">
            <div>
              <p className="font-medium text-gray-700">Permission Request</p>
              <p className="text-sm text-gray-500">Sent to parents when a new form needs signing</p>
            </div>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 py-2">
            <div>
              <p className="font-medium text-gray-700">Reminder</p>
              <p className="text-sm text-gray-500">Sent when deadline is approaching</p>
            </div>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-700">Confirmation</p>
              <p className="text-sm text-gray-500">Sent after parent signs a form</p>
            </div>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
