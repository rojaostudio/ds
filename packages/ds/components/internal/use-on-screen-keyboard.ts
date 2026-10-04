'use client';

import { useEffect, useState } from 'react';

/** The compact arrangement (layout/compact, below lg 1024): the phone, where the on-screen keyboard lives. */
const COMPACT = '(max-width: 1023px)';

/**
 * The keyboard is open when the visible area is less than this share of the layout viewport. A phone keyboard takes
 * 35 to 50% of the screen; the browser's own bars coming and going move it by far less than 25%.
 */
const KEYBOARD_RATIO = 0.75;

/** Input types that never bring up the on-screen keyboard. */
const NO_KEYBOARD = new Set(['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit']);

/** Whether focusing this element brings up the on-screen keyboard: a text field, a text area or contenteditable. */
export function isEditable(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement) return !el.readOnly && !el.disabled;
  if (el instanceof HTMLInputElement) return !NO_KEYBOARD.has(el.type) && !el.readOnly && !el.disabled;
  return false;
}

/**
 * Whether the phone's on-screen keyboard is open: compact screen (below 1024), an editable field focused, and the
 * visible area (visualViewport, scaled back from a pinch zoom) well short of the layout viewport. For the bars at the
 * foot of the screen (FormActions, SavingBar), which leave while it is open so they do not cover the field being
 * typed in. Without visualViewport (old browsers) or on the server it is always false: the bar stays.
 * `enabled` false skips the listeners (a layout that does not sit at the foot).
 */
export function useOnScreenKeyboard(enabled = true): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!enabled || !viewport || typeof window.matchMedia !== 'function') {
      setOpen(false);
      return;
    }
    const compact = window.matchMedia(COMPACT);
    let frame = 0;
    const measure = () =>
      compact.matches &&
      isEditable(document.activeElement) &&
      viewport.height * viewport.scale < window.innerHeight * KEYBOARD_RATIO;
    // One frame later: on focusout the next element is not focused yet, and the viewport settles as the keyboard moves.
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setOpen(measure()));
    };
    check();
    viewport.addEventListener('resize', check);
    window.addEventListener('resize', check);
    document.addEventListener('focusin', check);
    document.addEventListener('focusout', check);
    compact.addEventListener('change', check);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', check);
      window.removeEventListener('resize', check);
      document.removeEventListener('focusin', check);
      document.removeEventListener('focusout', check);
      compact.removeEventListener('change', check);
    };
  }, [enabled]);

  return enabled && open;
}
