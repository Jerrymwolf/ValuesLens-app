import { useEffect, useState } from 'react';

/**
 * Hook to guard against hydration mismatches when using localStorage-persisted state.
 * Returns false on server/initial render, true after client hydration completes.
 *
 * Usage:
 * ```
 * const isHydrated = useHydration();
 * if (!isHydrated) return <LoadingSpinner />;
 * // Now safe to use localStorage-persisted state
 * ```
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
