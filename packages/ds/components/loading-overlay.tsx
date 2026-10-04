'use client';

import { useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Spinner } from './spinner';

export interface LoadingOverlayProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * The action is running (Figma: `open`, code only). The overlay shows only if it is still true after `delay`:
   * if the next page opens first, it never shows.
   */
  open: boolean;
  /** What is happening, in the gerund with its object: "Criando o produto…" (Figma: `label`). It is the dialog's name and is said once (aria-live="polite"). */
  label?: string;
  /**
   * How long (ms) `open` has to stay true before the overlay shows. Up to it, the wait is the main button in
   * loading (`<Button loading>`, or the SavingBar in `status="saving"`); past it, the overlay comes in and stays
   * until the other page opens. 400 by default; 0 shows it at once.
   */
  delay?: number;
  /** Where the portal goes (default: document.body). Inside a `.ds-plate`, for example, to read the brand mode. */
  container?: HTMLElement | null;
}

/** The elements outside the overlay that it made inert and busy, with what they had before. */
type Marked = { el: Element; inert: string | null; busy: string | null };

/**
 * Marks inert and aria-busy every element outside `keep`, from `keep` up to the body: the siblings at each level.
 * Returns what to put back. An element already inert is left as it was.
 */
function isolate(keep: Element): Marked[] {
  const marked: Marked[] = [];
  for (let node: Element | null = keep; node && node !== document.body && node.parentElement; node = node.parentElement) {
    for (const sibling of node.parentElement.children) {
      if (sibling === node || sibling.hasAttribute('inert') || /^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(sibling.tagName)) continue;
      marked.push({ el: sibling, inert: sibling.getAttribute('inert'), busy: sibling.getAttribute('aria-busy') });
      sibling.setAttribute('inert', '');
      sibling.setAttribute('aria-busy', 'true');
    }
  }
  return marked;
}

function restore(marked: Marked[]) {
  for (const { el, inert, busy } of marked) {
    if (inert === null) el.removeAttribute('inert');
    else el.setAttribute('inert', inert);
    if (busy === null) el.removeAttribute('aria-busy');
    else el.setAttribute('aria-busy', busy);
  }
}

/**
 * LoadingOverlay — Figma [RDS] Overlays/LoadingOverlay. The long wait of an action that leads to another page
 * (create the product and land on its editing). A veil over the whole screen (loading-overlay/scrim) and, in the
 * middle, a panel (loading-overlay/background, radius/container, elevation/modal) with the Spinner lg and one line
 * saying what is happening. Styles: loading-overlay.css.
 *
 * Time: up to `delay` (~400 ms) only the main button is in loading ("Criando…", aria-busy on the button); past it,
 * the overlay shows, and it stays until the other page opens. If the navigation comes first, it never shows. Do not
 * use it for short waits (it only flashes), to load a page or a list (PageSkeleton), for a measured wait (Progress),
 * or to save without changing page (the SavingBar in `status="saving"`). Never two indicators: with the overlay,
 * the SavingBar keeps only its button in loading.
 *
 * Error: the app sets `open={false}` (the overlay leaves and the focus goes back to where it was, the main button)
 * and returns the error to the SavingBar in `status="error"`, with the form untouched.
 *
 * Accessibility: role="dialog" aria-modal="true" named by `label`; the focus goes to the panel (tabindex=-1) and
 * stays there; Escape does not close it (the action is running). While it is shown, the rest of the page is
 * `inert` and `aria-busy="true"` (put back on close). The label is in an aria-live="polite" region. With
 * prefers-reduced-motion: reduce, no fade, and the Spinner turns slowly (3 s a turn).
 */
export function LoadingOverlay({ open, label = 'Carregando…', delay = 400, container, className, ...rest }: LoadingOverlayProps) {
  const [shown, setShown] = useState(false);
  const veil = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    if (delay <= 0) {
      setShown(true);
      return;
    }
    const timer = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(timer);
  }, [open, delay]);

  // Focus in, the page behind inert and busy; all of it undone on close.
  useLayoutEffect(() => {
    if (!shown || !veil.current || !panel.current) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const marked = isolate(veil.current);
    const box = panel.current;
    box.focus({ preventScroll: true });
    // The focus stays in the panel: anything that takes it elsewhere gives it back.
    const keep = (event: FocusEvent) => {
      if (!box.contains(event.target as Node)) box.focus({ preventScroll: true });
    };
    document.addEventListener('focusin', keep);
    return () => {
      document.removeEventListener('focusin', keep);
      restore(marked);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [shown]);

  if (!shown || typeof document === 'undefined') return null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Escape does not close (the action is running), and Tab has nowhere to go: the panel is the only stop.
    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return createPortal(
    <div {...rest} ref={veil} className={['rds-loading-overlay', className].filter(Boolean).join(' ')} onKeyDown={onKeyDown}>
      <div ref={panel} className="rds-loading-overlay__panel" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        {/* The Spinner is the picture; the label below says it, once. */}
        <Spinner size="lg" tone="neutral" aria-hidden="true" />
        <p className="rds-loading-overlay__label" aria-live="polite">
          {label}
        </p>
      </div>
    </div>,
    container ?? document.body,
  );
}
