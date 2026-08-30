'use client';

import { useState, useRef, useEffect, useId, type ReactNode } from 'react';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  /** Extra classes on the tooltip bubble — use to override whitespace-nowrap for rich content */
  className?: string;
  /** Classes on the trigger wrapper span — override the default `inline-flex items-center` when the
   *  target must fill a flex/grid cell (e.g. `relative flex-1`, `block w-full`). */
  wrapperClassName?: string;
}

type Side = 'top' | 'bottom' | 'left' | 'right';

const GAP = 8; // gap between trigger and tooltip (includes arrow)

function getFixedPos(rect: DOMRect, side: Side) {
  const vpW = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const EDGE = 80;

  switch (side) {
    case 'right':
      return { top: rect.top + rect.height / 2, left: rect.right + GAP, transform: 'translateY(-50%)' };
    case 'left':
      return { top: rect.top + rect.height / 2, left: rect.left - GAP, transform: 'translate(-100%, -50%)' };
    case 'bottom': {
      const cx = rect.left + rect.width / 2;
      if (cx > vpW - EDGE) return { top: rect.bottom + GAP, left: rect.right, transform: 'translateX(-100%)' };
      if (cx < EDGE)       return { top: rect.bottom + GAP, left: rect.left, transform: '' };
      return { top: rect.bottom + GAP, left: cx, transform: 'translateX(-50%)' };
    }
    case 'top':
    default: {
      const cx = rect.left + rect.width / 2;
      if (cx > vpW - EDGE) return { top: rect.top - GAP, left: rect.right, transform: 'translate(-100%, -100%)' };
      if (cx < EDGE)       return { top: rect.top - GAP, left: rect.left, transform: 'translateY(-100%)' };
      return { top: rect.top - GAP, left: cx, transform: 'translate(-50%, -100%)' };
    }
  }
}

const ARROW_CLASSES: Record<Side, string> = {
  top:    `bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-[var(--tooltip-bg)] border-x-transparent border-b-transparent`,
  bottom: `top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-[var(--tooltip-bg)] border-x-transparent border-t-transparent`,
  left:   `right-0 top-1/2 -translate-y-1/2 translate-x-full border-l-[var(--tooltip-bg)] border-y-transparent border-r-transparent`,
  right:  `left-0 top-1/2 -translate-y-1/2 -translate-x-full border-r-[var(--tooltip-bg)] border-y-transparent border-l-transparent`,
};

export function Tooltip({ content, children, side = 'top', delay = 300, className, wrapperClassName }: TooltipProps) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);
  const [pos, setPos] = useState<{ top: number; left: number; transform: string } | null>(null);

  function show() {
    timer.current = setTimeout(() => {
      if (!ref.current) return;
      setPos(getFixedPos(ref.current.getBoundingClientRect(), side));
    }, delay);
  }

  function hide() {
    if (timer.current) clearTimeout(timer.current);
    setPos(null);
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <span
      ref={ref}
      className={wrapperClassName ?? 'inline-flex items-center'}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={pos ? id : undefined}
    >
      {children}
      {pos && (
        <span
          id={id}
          role="tooltip"
          style={{ position: 'fixed', top: pos.top, left: pos.left, transform: pos.transform }}
          className={`z-[9999] px-2.5 py-1.5 bg-[var(--tooltip-bg)] text-[var(--tooltip-text)] text-caption font-medium rounded-(--radius-tooltip) whitespace-nowrap pointer-events-none shadow-md${className ? ` ${className}` : ''}`}
        >
          {/* Arrow */}
          <span
            aria-hidden="true"
            className={[
              'absolute border-[5px]',
              ARROW_CLASSES[side],
            ].join(' ')}
            style={{ width: 0, height: 0 }}
          />
          {content}
        </span>
      )}
    </span>
  );
}
