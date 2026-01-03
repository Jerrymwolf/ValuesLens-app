'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user prefers reduced motion.
 * Returns true if the user has enabled reduced motion in their system settings.
 *
 * Usage:
 * const prefersReducedMotion = useReducedMotion();
 *
 * // Conditionally apply animations
 * <motion.div
 *   animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }}
 * />
 *
 * // Or use Framer Motion's built-in support
 * <motion.div
 *   transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
 * />
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns animation props that respect reduced motion preference.
 * Useful for creating consistent reduced motion behavior.
 */
export function useAnimationProps(reducedMotion: boolean) {
  return {
    // Disable spring animations
    transition: reducedMotion
      ? { duration: 0 }
      : undefined,

    // Helper to conditionally apply animate prop
    conditionalAnimate: <T extends object>(animate: T): T | Record<string, never> =>
      reducedMotion ? {} : animate,
  };
}
