'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { CheckCheckIcon, CheckIcon } from './internal/icons';
import { useWhatsAppPlatform, type WhatsAppPlatform } from './internal/whatsapp';

export type { WhatsAppPlatform };
export type WhatsAppMessageType = 'received' | 'sent' | 'delivered' | 'read';

export interface WhatsAppMessageProps extends HTMLAttributes<HTMLDivElement> {
  /** The message (Figma: `text`). Line breaks are kept. */
  text: ReactNode;
  /** The time under it, such as "11:59" (Figma: `time`). */
  time?: string;
  /** android (Roboto) or ios. Inside a WhatsAppChat, the chat's by default. */
  platform?: WhatsAppPlatform;
  /** received: white, on the left; sent, delivered or read: green, on the right, with one tick, two grey or two blue. */
  type?: WhatsAppMessageType;
}

const TICKS: Record<Exclude<WhatsAppMessageType, 'received'>, string> = { sent: 'Enviada', delivered: 'Entregue', read: 'Lida' };

/**
 * WhatsAppMessage — Figma [RDS] External/WhatsAppMessage. A MOCKUP of a WhatsApp message bubble (2024 look), for
 * flows. The ticks are said in words to screen readers. Styles: whatsapp-message.css and internal/whatsapp.css.
 */
export function WhatsAppMessage({ text, time = '11:59', platform, type = 'received', className, ...rest }: WhatsAppMessageProps) {
  const finalPlatform = useWhatsAppPlatform(platform);
  const out = type !== 'received';
  return (
    <div
      {...rest}
      className={['rds-whatsapp-message', `rds-whatsapp--${finalPlatform}`, out ? 'rds-whatsapp-message--out' : 'rds-whatsapp-message--in', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="rds-whatsapp-message__bubble">
        <div className="rds-whatsapp-message__text">{text}</div>
        <div className="rds-whatsapp-message__meta">
          <span>{time}</span>
          {out && (
            <span className={`rds-whatsapp-message__ticks rds-whatsapp-message__ticks--${type}`}>
              {type === 'sent' ? <CheckIcon /> : <CheckCheckIcon />}
              <span className="rds-visually-hidden">{TICKS[type]}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
