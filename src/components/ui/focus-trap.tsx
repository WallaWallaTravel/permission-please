'use client';

/**
 * Focus Trap Component
 *
 * Traps focus within a container (for modals, dialogs, etc.)
 * Required for WCAG 2.4.3: Focus Order
 */

import { useRef, useEffect, useCallback } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  initialFocus?: boolean;
  returnFocus?: boolean;
}

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function FocusTrap({
  children,
  active = true,
  initialFocus = true,
  returnFocus = true,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previously focused element
  useEffect(() => {
    if (active && returnFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    return () => {
      if (returnFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, returnFocus]);

  // Set initial focus
  useEffect(() => {
    if (!active || !initialFocus || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS);
    const firstFocusable = focusableElements[0] as HTMLElement;

    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, [active, initialFocus]);

  // Handle tab key navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!active || event.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS);
      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

      // Shift + Tab: go to last element if on first
      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab: go to first element if on last
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    },
    [active]
  );

  useEffect(() => {
    if (!active) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, handleKeyDown]);

  return <div ref={containerRef}>{children}</div>;
}
