import type { HTMLAttributes, ReactNode } from 'react';

export type MessageAlign = 'start' | 'end';

export interface MessageProps extends HTMLAttributes<HTMLElement> {
  /** start: the one answering, avatar on the left; end: the person writing, on the right. */
  align?: MessageAlign;
  /**
   * Who said it (Figma: `showHeader` + `name`). Leave it out, with `time`, in the upper messages of a sequence from
   * the same person: the header goes away.
   */
  name?: ReactNode;
  /** When, as shown, such as "14:32" (Figma: `time`). */
  time?: ReactNode;
  /** The machine-readable moment, for the `<time>` element (ISO 8601). */
  dateTime?: string;
  /** An Avatar (Figma: `showAvatar`). Leave it out in the upper messages of a sequence. */
  avatar?: ReactNode;
  /** The Bubble (the Figma exposes it: pick its variant there). */
  children: ReactNode;
  /**
   * The actions (Figma: `showFooter` + slot `footer`): neutral ghost IconButtons — copy, try again, rate; edit on
   * the person's own message.
   */
  footer?: ReactNode;
}

/**
 * Message — Figma [RDS] Chat/Message. One message of the conversation: avatar, name and time, the Bubble and the
 * actions. Goes in a MessageScroller. Styles: message.css.
 */
export function Message({ align = 'start', name, time, dateTime, avatar, children, footer, className, ...rest }: MessageProps) {
  return (
    <article {...rest} className={['rds-message', `rds-message--${align}`, className].filter(Boolean).join(' ')}>
      {avatar && <div className="rds-message__avatar">{avatar}</div>}
      <div className="rds-message__content">
        {(name || time) && (
          <p className="rds-message__header">
            {name && <span className="rds-message__name">{name}</span>}
            {time && (
              <time className="rds-message__time" dateTime={dateTime}>
                {time}
              </time>
            )}
          </p>
        )}
        {children}
        {footer && <div className="rds-message__footer">{footer}</div>}
      </div>
    </article>
  );
}
