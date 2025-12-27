/**
 * Visually Hidden Component
 *
 * Hides content visually while keeping it accessible to screen readers.
 * Use for:
 * - Icon-only buttons that need accessible labels
 * - Form labels that are visually implied but need screen reader text
 * - Live regions for dynamic content announcements
 */

import { cn } from '@/lib/utils';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
}

export function VisuallyHidden({
  children,
  as: Component = 'span',
  className,
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn(
        'absolute -m-px h-px w-px overflow-hidden border-0 p-0 whitespace-nowrap',
        // Clip to hide but keep in accessibility tree
        '[clip:rect(0,0,0,0)]',
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Live Region Component
 *
 * Announces dynamic content changes to screen readers.
 * WCAG 4.1.3: Status Messages
 */
interface LiveRegionProps {
  children: React.ReactNode;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  className?: string;
}

export function LiveRegion({
  children,
  'aria-live': ariaLive = 'polite',
  'aria-atomic': ariaAtomic = true,
  className,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
}
