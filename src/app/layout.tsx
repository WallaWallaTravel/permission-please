import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/shared/Providers';
import { SkipLink } from '@/components/ui/skip-link';

export const metadata: Metadata = {
  title: 'Permission Please - Digital Permission Slips',
  description:
    'Modern digital permission slips for schools. Create, send, and track permission forms effortlessly.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SkipLink />
        <Providers>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
