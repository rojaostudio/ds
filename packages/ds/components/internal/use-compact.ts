'use client';

import { useSyncExternalStore } from 'react';

/** The compact arrangement (Figma viewport mode, layout/compact): below lg 1024. Not exported. */
export const COMPACT_QUERY = '(max-width: 1023px)';

/**
 * Whether the screen is compact (below 1024), following resizes. False on the server and where matchMedia is
 * missing, so the first paint is the expanded arrangement.
 */
export function useCompact(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
      const query = window.matchMedia(COMPACT_QUERY);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(COMPACT_QUERY).matches,
    () => false,
  );
}
