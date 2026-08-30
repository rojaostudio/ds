'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * useDismiss — outside-click + ESC para overlays (dropdown, combobox, etc).
 * Stale-closure safe: handler updates on every render via ref.
 */
export function useDismiss(
  popupRef:   RefObject<Element | null>,
  triggerRef: RefObject<Element | null>,
  onDismiss:  () => void,
  active:     boolean,
) {
  const cb = useRef(onDismiss);
  cb.current = onDismiss;

  useEffect(() => {
    if (!active) return;
    const onMouse = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popupRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      cb.current();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cb.current(); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
}
