import type { HTMLAttributes, ReactNode } from 'react';
import { Button } from './button';
import { RotateCcwIcon } from './internal/icons';
import { Spinner } from './spinner';

export type MessageAlign = 'start' | 'end';

/** Where the person's own message is on its way (Figma: `status`, align=end only). */
export type MessageStatus = 'sending' | 'sent' | 'failed';

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
  /**
   * The delivery of the person's own message (Figma: `status`, ds#179). Only with align="end". sending: a Spinner and
   * `sendingLabel` in place of the time; sent: the time, as without a status; failed: the Bubble turns soft + danger
   * and a line under it says `failedLabel`, with a "try again" button that calls `onRetry`. Each change is said once
   * by a polite live region. Leave it out for a message that has no delivery to follow.
   */
  status?: MessageStatus;
  /** Called by the "try again" button of a failed message. Without it the button does not show. */
  onRetry?: () => void;
  /** Said and shown while sending (Figma: `sendingLabel`). */
  sendingLabel?: string;
  /** Said when it arrives. Not shown: the time is. */
  sentLabel?: string;
  /** Said and shown when it failed (Figma: `failedLabel`). */
  failedLabel?: string;
  /** The "try again" button's text. */
  retryLabel?: string;
}

/**
 * Message — Figma [RDS] Chat/Message. One message of the conversation: avatar, name and time, the Bubble and the
 * actions. Goes in a MessageScroller. Styles: message.css.
 */
export function Message({
  align = 'start',
  name,
  time,
  dateTime,
  avatar,
  children,
  footer,
  status,
  onRetry,
  sendingLabel = 'Enviando',
  sentLabel = 'Enviada',
  failedLabel = 'Não enviada',
  retryLabel = 'Tentar de novo',
  className,
  ...rest
}: MessageProps) {
  // The delivery is the writer's: a start message ignores it.
  const delivery = align === 'end' ? status : undefined;
  const sending = delivery === 'sending';
  const announce = { sending: sendingLabel, sent: sentLabel, failed: failedLabel }[delivery ?? 'sent'];
  return (
    <article
      {...rest}
      aria-busy={sending || undefined}
      className={['rds-message', `rds-message--${align}`, delivery && `rds-message--${delivery}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      {avatar && <div className="rds-message__avatar">{avatar}</div>}
      <div className="rds-message__content">
        {(name || time || sending) && (
          <p className="rds-message__header">
            {name && <span className="rds-message__name">{name}</span>}
            {sending ? (
              // Said by the live region below; here it is only seen.
              <span className="rds-message__sending" aria-hidden="true">
                <Spinner size="sm" />
                {sendingLabel}
              </span>
            ) : (
              time && (
                <time className="rds-message__time" dateTime={dateTime}>
                  {time}
                </time>
              )
            )}
          </p>
        )}
        {children}
        {delivery === 'failed' && (
          <div className="rds-message__failed">
            <span aria-hidden="true">{failedLabel}</span>
            {onRetry && (
              <Button tone="neutral" variant="ghost" size="sm" icon={<RotateCcwIcon />} iconPosition="start" onClick={onRetry}>
                {retryLabel}
              </Button>
            )}
          </div>
        )}
        {footer && <div className="rds-message__footer">{footer}</div>}
      </div>
      {delivery && (
        // One live region for the whole delivery, mounted with the status, so each change is announced.
        <span className="rds-visually-hidden" role="status">
          {announce}
        </span>
      )}
    </article>
  );
}
