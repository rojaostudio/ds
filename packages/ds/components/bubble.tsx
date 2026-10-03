import type { HTMLAttributes, ReactNode } from 'react';
import { ThumbsUpIcon } from './internal/icons';

/** The emphasis (Figma: `variant`). */
export type BubbleVariant = 'fill' | 'soft' | 'outline' | 'ghost';
/** The colour (Figma: `tone`). action and danger exist only on soft. */
export type BubbleTone = 'neutral' | 'action' | 'danger';
export type BubbleAlign = 'start' | 'end';

interface BubbleBase extends HTMLAttributes<HTMLDivElement> {
  /** start: the one answering, the small corner bottom left; end: the person writing, bottom right. */
  align?: BubbleAlign;
  /**
   * The three dots of the one answering while they write (Figma: `typing=true`); no text, no reactions. The
   * surface is the soft neutral one, whatever `variant` and `tone` say.
   */
  typing?: boolean;
  /**
   * The message (Figma: `text`). Line breaks are kept. With `typing` it is what a screen reader hears instead of the
   * dots, "digitando…" by default ("Ana está digitando…").
   */
  children?: ReactNode;
  /** How many reacted (Figma: `showReactions` + `reactions`). The pill goes under the text; 0 hides it. */
  reactions?: number;
}

/**
 * The surface (Figma: `variant` × `tone`, only the combinations the Figma draws):
 * - soft (default): the one answering. tone neutral (default), action (the brand tint) or danger (it was not sent).
 * - fill: the person writing, in the brand colour. outline: on a coloured background. ghost: a long answer from the
 *   assistant, no box. These three are neutral only.
 */
export type BubbleProps = BubbleBase &
  ({ variant?: 'soft'; tone?: BubbleTone } | { variant: 'fill' | 'outline' | 'ghost'; tone?: 'neutral' });

/**
 * Bubble — Figma [RDS] Chat/Bubble. The surface of a message: it grows up to 480 and wraps. Inside a Message,
 * which adds the avatar, the name and the actions. Styles: bubble.css.
 */
export function Bubble({ variant = 'soft', tone = 'neutral', typing = false, align = 'start', children, reactions, className, ...rest }: BubbleProps) {
  if (typing) {
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
    <div {...rest} className={['rds-bubble', `rds-bubble--${variant}`, `rds-bubble--${tone}`, `rds-bubble--${align}`, className].filter(Boolean).join(' ')}>
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
