'use client';

import { useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';
import { ArrowDownIcon } from './internal/icons';

export interface MessageScrollerProps extends HTMLAttributes<HTMLDivElement> {
  /** The Messages and Markers, from the oldest to the newest (Figma: slot `content`). */
  children: ReactNode;
  /** Names the conversation for screen readers. */
  label?: string;
  /** The accessible name of the "go to the end" button. */
  scrollButtonLabel?: string;
}

// Closer than this to the end still counts as "at the end".
const NEAR_END = 24;

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * MessageScroller — Figma [RDS] Chat/MessageScroller. The frame that scrolls the conversation, held to the bottom
 * (role="log", so screen readers hear what arrives). A new item keeps it at the end; if the person scrolled up to
 * read, it stays put and the "go to the end" button appears by itself (Figma: `showButton` only simulates that).
 * It fills its parent's height: size the parent to the chat area. Styles: message-scroller.css.
 */
export function MessageScroller({
  children,
  label = 'Conversa',
  scrollButtonLabel = 'Ir para a mensagem mais nova',
  className,
  onScroll,
  ...rest
}: MessageScrollerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const atEnd = useRef(true);
  // True while the button's smooth scroll runs: its in-between positions must not bring the button back.
  const goingToEnd = useRef(false);
  const [showButton, setShowButton] = useState(false);

  const toEnd = (behavior: ScrollBehavior = 'auto') => {
    const box = ref.current;
    if (box) box.scrollTo({ top: box.scrollHeight, behavior });
  };

  // A new item: follow it if the person was at the end; otherwise offer the button.
  useLayoutEffect(() => {
    if (atEnd.current) toEnd();
  }, [children]);

  useEffect(() => toEnd(), []);

  // A smooth scroll the person interrupted (a wheel up mid-way) ends short of the end: the button comes back.
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const isAtEnd = () => box.scrollHeight - box.scrollTop - box.clientHeight <= NEAR_END;
    const settle = () => {
      atEnd.current = isAtEnd();
      if (goingToEnd.current && !atEnd.current) {
        // A late scrollend (from an earlier scroll) can land while the smooth scroll is still moving:
        // only call it interrupted if the position really stopped.
        const top = box.scrollTop;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (!goingToEnd.current || box.scrollTop !== top) return;
            goingToEnd.current = false;
            setShowButton(!isAtEnd());
          }),
        );
        return;
      }
      goingToEnd.current = false;
      setShowButton(!atEnd.current);
    };
    box.addEventListener('scrollend', settle);
    return () => box.removeEventListener('scrollend', settle);
  }, []);

  return (
    <div className={['rds-scroller', className].filter(Boolean).join(' ')}>
      <div
        ref={ref}
        role="log"
        aria-label={label}
        tabIndex={0}
        {...rest}
        className="rds-scroller__viewport"
        onScroll={(event) => {
          const box = event.currentTarget;
          atEnd.current = box.scrollHeight - box.scrollTop - box.clientHeight <= NEAR_END;
          if (atEnd.current) goingToEnd.current = false;
          if (!goingToEnd.current) setShowButton(!atEnd.current);
          onScroll?.(event);
        }}
      >
        <div className="rds-scroller__content">{children}</div>
      </div>
      {showButton && (
        <Tooltip text={scrollButtonLabel}>
          <IconButton
            className="rds-scroller__to-end"
            icon={<ArrowDownIcon />}
            label={scrollButtonLabel}
            tone="neutral"
            variant="outline"
            onClick={() => {
              // The button goes away: the focus stays on the conversation, which then scrolls to the end.
              ref.current?.focus({ preventScroll: true });
              atEnd.current = true;
              goingToEnd.current = true;
              setShowButton(false);
              toEnd(reducedMotion() ? 'auto' : 'smooth');
            }}
          />
        </Tooltip>
      )}
    </div>
  );
}
