import type { HTMLAttributes, ReactNode } from 'react';
import { ThumbsUpIcon } from './internal/icons';

export type BubbleVariant = 'fill' | 'muted' | 'tinted' | 'outline' | 'ghost' | 'error' | 'typing';
export type BubbleAlign = 'start' | 'end';

export interface BubbleProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The surface (Figma: `style`). fill: the person writing, in the brand colour. muted or tinted: the one answering.
   * outline: on a coloured background. ghost: a long answer from the assistant, no box. error: it was not sent.
   * typing: the three dots of the one answering while they write; no text, no reactions.
   */
  variant?: BubbleVariant;
  /** start: the one answering, the small corner bottom left; end: the person writing, bottom right. */
  align?: BubbleAlign;
  /**
   * The message (Figma: `text`). Line breaks are kept. In `typing` it is what a screen reader hears instead of the
   * dots, "digitando…" by default ("Ana está digitando…").
   */
  children?: ReactNode;
  /** How many reacted (Figma: `showReactions` + `reactions`). The pill goes under the text; 0 hides it. */
  reactions?: number;
}

/**
 * Bubble — Figma [RDS] Chat/Bubble. The surface of a message: it grows up to 480 and wraps. Inside a Message,
 * which adds the avatar, the name and the actions. Styles: bubble.css.
 */
export function Bubble({ variant = 'muted', align = 'start', children, reactions, className, ...rest }: BubbleProps) {
  if (variant === 'typing') {
    // A live region: it is announced when it appears. The dots pulse every 1400 ms and stand still under reduced motion.
    return (
      <div role="status" {...rest} className={['rds-bubble', 'rds-bubble--typing', `rds-bubble--${align}`, className].filter(Boolean).join(' ')}>
        <span className="rds-bubble__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="rds-visually-hidden">{children ?? 'digitando…'}</span>
      </div>
    );
  }
  return (
    <div {...rest} className={['rds-bubble', `rds-bubble--${variant}`, `rds-bubble--${align}`, className].filter(Boolean).join(' ')}>
      <div className="rds-bubble__text">{children}</div>
      {reactions !== undefined && reactions > 0 && (
        <div className="rds-bubble__reactions-row">
          <span className="rds-bubble__reactions">
            <span className="rds-bubble__reactions-count" aria-hidden="true">
              <ThumbsUpIcon />
              {reactions}
            </span>
            <span className="rds-visually-hidden">{reactions === 1 ? '1 reação' : `${reactions} reações`}</span>
          </span>
        </div>
      )}
    </div>
  );
}
