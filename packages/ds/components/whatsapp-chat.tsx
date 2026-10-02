'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  CameraIcon,
  ChevronLeftIcon,
  MicIcon,
  MoreVerticalIcon,
  PaperclipIcon,
  PhoneIcon,
  SmileIcon,
} from './internal/icons';
import { WhatsAppPlatformContext, type WhatsAppPlatform } from './internal/whatsapp';

export interface WhatsAppChatProps extends HTMLAttributes<HTMLDivElement> {
  /** WhatsAppTemplate and WhatsAppMessage, from the oldest to the newest (Figma: slot `messages`). */
  children?: ReactNode;
  /** The business's name in the header (Figma: `name`). */
  name?: string;
  /** The line under the name (Figma: `subtitle`). */
  subtitle?: string;
  /** The verified badge next to the name (Figma: `showVerified`). */
  showVerified?: boolean;
  /** The business's picture: its logo, always by slot (the design system carries no client logo). */
  avatar?: ReactNode;
  /** android (Roboto) or ios. The messages inside follow it. */
  platform?: WhatsAppPlatform;
  /** The time in the status bar. */
  time?: string;
}

/**
 * WhatsAppChat — Figma [RDS] External/WhatsAppChat. A MOCKUP of a WhatsApp Business conversation, 360 × 780, for
 * flows: the status bar, the header, the day, Meta's notice, the messages and the composer. Nothing in it works;
 * the bars are decorative and the messages are read. Styles: whatsapp-chat.css and internal/whatsapp.css.
 */
export function WhatsAppChat({
  children,
  name = 'Rojão',
  subtitle = 'Conta comercial',
  showVerified,
  avatar,
  platform = 'android',
  time,
  className,
  ...rest
}: WhatsAppChatProps) {
  const ios = platform === 'ios';
  return (
    <WhatsAppPlatformContext.Provider value={platform}>
      <div
        role="group"
        aria-label={`Mockup: conversa do WhatsApp com ${name}`}
        {...rest}
        className={['rds-whatsapp-chat', `rds-whatsapp--${platform}`, className].filter(Boolean).join(' ')}
      >
        <div className="rds-whatsapp-chat__status" aria-hidden="true">
          <span>{time ?? (ios ? '9:41' : '12:30')}</span>
          <span className="rds-whatsapp-chat__indicators">
            <span />
            <span />
            <span />
          </span>
        </div>
        <div className="rds-whatsapp-chat__header">
          <span className="rds-whatsapp-chat__icon" aria-hidden="true">
            {ios ? <ChevronLeftIcon /> : <ArrowLeftIcon />}
          </span>
          <span className="rds-whatsapp-chat__avatar">{avatar}</span>
          <span className="rds-whatsapp-chat__contact">
            <span className="rds-whatsapp-chat__name">
              {name}
              {showVerified && (
                <span className="rds-whatsapp-chat__verified">
                  <span aria-hidden="true">
                    <BadgeCheckIcon />
                  </span>
                  <span className="rds-visually-hidden">(verificada)</span>
                </span>
              )}
            </span>
            <span className="rds-whatsapp-chat__subtitle">{subtitle}</span>
          </span>
          <span className="rds-whatsapp-chat__actions" aria-hidden="true">
            <PhoneIcon />
            {!ios && <MoreVerticalIcon />}
          </span>
        </div>
        <div className="rds-whatsapp-chat__conversation">
          <span className="rds-whatsapp-chat__date">Hoje</span>
          <p className="rds-whatsapp-chat__notice">
            Esta empresa usa um serviço seguro da Meta para gerenciar esta conversa. Saiba mais
          </p>
          <div className="rds-whatsapp-chat__messages">{children}</div>
        </div>
        <div className="rds-whatsapp-chat__composer" aria-hidden="true">
          <span className="rds-whatsapp-chat__field">
            {!ios && <SmileIcon />}
            <span className="rds-whatsapp-chat__placeholder">Mensagem</span>
            <PaperclipIcon />
            <CameraIcon />
          </span>
          <span className="rds-whatsapp-chat__mic">
            <MicIcon />
          </span>
        </div>
      </div>
    </WhatsAppPlatformContext.Provider>
  );
}
