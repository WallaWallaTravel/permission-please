/**
 * Skip Link Component
 *
 * Provides keyboard users a way to skip repetitive navigation
 * and jump directly to main content. Required for WCAG 2.4.1.
 */

import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

export function SkipLink({
  href = '#main-content',
  children = 'Skip to main content',
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Visually hidden by default
        'sr-only',
        // Show on focus
        'focus:not-sr-only focus:absolute focus:z-50',
        'focus:top-4 focus:left-4',
        'focus:px-4 focus:py-2',
        'focus:bg-blue-600 focus:text-white',
        'focus:rounded-lg focus:shadow-lg',
        'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
        // Smooth transition
        'transition-all'
      )}
    >
      {children}
    </a>
  );
}
