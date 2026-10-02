import type { HTMLAttributes, ReactNode } from 'react';
import { PhoneIcon } from './internal/icons';
import type { WhatsAppPlatform } from './internal/whatsapp';

export interface WhatsAppNotificationProps extends HTMLAttributes<HTMLDivElement> {
  /** Who sent it: the business's name (Figma: `title`). */
  title?: string;
  /** The message, cut at three lines (Figma: `message`). */
  message: ReactNode;
  /** When, such as "agora" (Figma: `when`). */
  when?: string;
  /** android: the Android notification anatomy; ios: Apple's, the picture with the app icon over it. */
  platform?: WhatsAppPlatform;
  /** The sender's picture: its logo, always by slot (the design system carries no client logo). */
  avatar?: ReactNode;
  /** The lock screen's clock and date. */
  time?: string;
  date?: string;
}

/**
 * WhatsAppNotification — Figma [RDS] External/WhatsAppNotification. A MOCKUP of a WhatsApp notification on the
 * lock screen, for flows. The wallpaper is a neutral gradient, no real picture. Nothing in it works; the clock is
 * decorative and the notification is read. Styles: whatsapp-notification.css.
 */
export function WhatsAppNotification({
  title = 'Rojão',
  message,
  when = 'agora',
  platform = 'android',
  avatar,
  time,
  date,
  className,
  ...rest
}: WhatsAppNotificationProps) {
  const ios = platform === 'ios';
  const appIcon = (
    <span className="rds-whatsapp-notification__app" aria-hidden="true">
      <PhoneIcon />
    </span>
  );
  return (
    <div
      role="group"
      aria-label="Mockup: notificação do WhatsApp"
      {...rest}
      className={['rds-whatsapp-notification', `rds-whatsapp--${platform}`, className].filter(Boolean).join(' ')}
    >
      <div className="rds-whatsapp-notification__clock" aria-hidden="true">
        <span className="rds-whatsapp-notification__date">{date ?? (ios ? 'Sáb. 26 de set.' : 'sáb., 26 de set.')}</span>
        <span className="rds-whatsapp-notification__time">{time ?? (ios ? '09:41' : '12:30')}</span>
      </div>
      <div className="rds-whatsapp-notification__card">
        {ios ? (
          <>
            <span className="rds-whatsapp-notification__picture">
              <span className="rds-whatsapp-notification__avatar">{avatar}</span>
              {appIcon}
            </span>
            <span className="rds-whatsapp-notification__text">
              <span className="rds-whatsapp-notification__title-row">
                <span className="rds-whatsapp-notification__title">{title}</span>
                <span className="rds-whatsapp-notification__when">{when}</span>
              </span>
              <span className="rds-whatsapp-notification__message">{message}</span>
            </span>
          </>
        ) : (
          <>
            <span className="rds-whatsapp-notification__text">
              <span className="rds-whatsapp-notification__app-row">
                {appIcon}
                <span>WhatsApp</span>
                <span aria-hidden="true">•</span>
                <span>{when}</span>
              </span>
              <span className="rds-whatsapp-notification__title">{title}</span>
              <span className="rds-whatsapp-notification__message">{message}</span>
            </span>
            <span className="rds-whatsapp-notification__avatar">{avatar}</span>
          </>
        )}
      </div>
    </div>
  );
}
