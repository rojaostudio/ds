'use client';

import { useEffect, useRef, type HTMLAttributes, type ReactNode, type RefObject } from 'react';
import { useOnScreenKeyboard } from './use-on-screen-keyboard';

export type BottomBarPlacement = 'docked' | 'floating';

export interface BottomBarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * docked (the container's width, against the foot, square corners) or floating (from lg 1024 up: in the bottom
   * right corner of the scrolling container, bottom-bar/floating/margin off the foot and the right, hugging its
   * content, bottom-bar/floating/padding-*, bottom-bar/floating/radius and the elevation/overlay shadow). Below 1024
   * floating is exactly docked (Figma: `placement`).
   */
  placement?: BottomBarPlacement;
  /**
   * The leading slot, on the left: one ~44 control, never running text. Left out (`undefined`), there is no slot: no
   * wrapper is rendered. Present (even `null` or `false` while its control is hidden, as the Figma's showLeading on
   * with the slot empty), the slot is there and reserves bottom-bar/leading/min-width (44, no minimum height), so what
   * follows does not jump when the control comes and goes. Whoever fills it says its own changes.
   */
  leading?: ReactNode;
  children: ReactNode;
}

// ── The Toaster's offset: while a bar is on screen, the toasts rise above it ────────────────────────────────

/** The custom property the Toaster reads (toast.css); its default there is space/16 off the foot. */
const TOAST_OFFSET = '--toast-offset-bottom';
/** The bars on screen now (mounted and not hidden by the keyboard), with what each one takes from the foot. */
const onScreen = new Map<HTMLElement, number>();

/** What a bar takes from the foot: its height plus its distance from it (bottom: 0 docked, the margin floating). */
function footprint(el: HTMLElement) {
  const bottom = Number.parseFloat(getComputedStyle(el).bottom);
  return el.getBoundingClientRect().height + (Number.isFinite(bottom) ? bottom : 0);
}

function publishToastOffset() {
  const root = document.documentElement;
  if (!onScreen.size) {
    root.style.removeProperty(TOAST_OFFSET);
    return;
  }
  const taken = Math.max(...onScreen.values());
  root.style.setProperty(TOAST_OFFSET, `calc(${taken}px + var(--space-16))`);
}

/**
 * Fills --toast-offset-bottom on the root while the bar is mounted and visible: its height (plus the floating margin)
 * plus 16. Measured, so it follows the arrangement (64 compact plus the safe area, 68 expanded, 64 + 24 floating) and
 * the breakpoint; removed when the bar leaves or the on-screen keyboard hides it, and the toasts go back to 16.
 */
function useToastOffset(ref: RefObject<HTMLDivElement | null>, visible: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !visible) return;
    const measure = () => {
      onScreen.set(el, footprint(el));
      publishToastOffset();
    };
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    // The breakpoint changes the place (bottom) without always changing the size.
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      onScreen.delete(el);
      publishToastOffset();
    };
  }, [ref, visible]);
}

/**
 * BottomBar — Figma [RDS] Actions/.bottom-bar, private: the shell at the foot of the screen under the FormActions and
 * the SavingBar. Not exported from the package. It owns the colour (bottom-bar/background, the brand's primary), the
 * height (64 plus env(safe-area-inset-bottom) compact, 68 expanded docked, 64 floating), the padding and gap, the
 * place (sticky at the bottom of the scrolling container; floating, in its bottom right corner), the placement, the
 * leading slot, the Button tokens in the bar's colours, the on-screen keyboard (compact: it slides away while a field
 * is being typed in) and the Toaster's offset (--toast-offset-bottom, while it is on screen). Whoever builds on it
 * puts the actions. Styles: bottom-bar.css.
 */
export function BottomBar({ placement = 'docked', leading, className, children, ...rest }: BottomBarProps) {
  const keyboard = useOnScreenKeyboard();
  const ref = useRef<HTMLDivElement>(null);
  useToastOffset(ref, !keyboard);
  return (
    <div
      {...rest}
      ref={ref}
      className={['rds-bottom-bar', `rds-bottom-bar--${placement}`, keyboard && 'rds-bottom-bar--keyboard', className]
        .filter(Boolean)
        .join(' ')}
    >
      {leading !== undefined && <div className="rds-bottom-bar__leading">{leading}</div>}
      {children}
    </div>
  );
}
