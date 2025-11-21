import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Permission Please 📝
          </h1>
          <p className="mt-6 text-xl leading-8 text-gray-600">
            Digital permission slips made simple.
            <br />
            No more paper. No more hassle.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Get Started
            </Link>
            <a href="#features" className="text-lg leading-6 font-semibold text-gray-900">
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-32">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Built for Modern Schools
          </h2>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <div className="text-4xl">⚡</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Fast & Easy</h3>
              <p className="mt-2 text-gray-600">
                Create and send permission forms in under 2 minutes. Parents can sign in seconds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <div className="text-4xl">📱</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Mobile Friendly</h3>
              <p className="mt-2 text-gray-600">
                Works perfectly on any device. Parents sign with their finger or mouse.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <div className="text-4xl">📊</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Real-Time Tracking</h3>
              <p className="mt-2 text-gray-600">
                See who signed and who hasn&apos;t at a glance. Automatic reminders before
                deadlines.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <div className="text-4xl">🔒</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Secure & Private</h3>
              <p className="mt-2 text-gray-600">
                Enterprise-grade security. Your data is encrypted and protected.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <div className="text-4xl">📧</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Auto Notifications</h3>
              <p className="mt-2 text-gray-600">
                Automatic emails to parents. Reminders for those who haven&apos;t signed yet.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <div className="text-4xl">🌍</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Eco-Friendly</h3>
              <p className="mt-2 text-gray-600">
                100% digital. Save trees and eliminate paper waste entirely.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 rounded-2xl bg-blue-600 px-6 py-16 text-center sm:px-16">
          <h2 className="text-3xl font-bold tracking-tight text-white">Ready to go paperless?</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100">
            Join modern schools using Permission Please to save time and eliminate paper permission
            slips.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/signup"
              className="rounded-md bg-white px-6 py-3 text-lg font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Get started for free
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-32 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          <p>
            Built with ❤️ for teachers, parents, and students
            <br />
            Making permission slips simple, one signature at a time
          </p>
          <div className="mt-4 flex justify-center gap-x-6">
            <span className="font-medium text-gray-700">Tech Stack:</span>
            <span>Next.js 16</span>
            <span>TypeScript</span>
            <span>Prisma</span>
            <span>Tailwind CSS</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
