'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { ExternalLinkIcon, MoreVerticalIcon, PhoneIcon, ReplyIcon } from './internal/icons';
import { useWhatsAppPlatform, type WhatsAppPlatform } from './internal/whatsapp';

export type WhatsAppTemplateHeader = 'none' | 'text' | 'image';

export interface WhatsAppTemplateProps extends HTMLAttributes<HTMLDivElement> {
  /** WhatsAppTemplateButton, up to 10 (Figma: slot `buttons`); with more than 3, WhatsApp shows 2 and "all-options". */
  children?: ReactNode;
  /** The header kind (Figma: `header`): none, a bold line (up to 60 characters) or an image. */
  header?: WhatsAppTemplateHeader;
  /** The header line, with `header="text"` (Figma: `headerText`). */
  headerText?: ReactNode;
  /** The header image, with `header="image"`: an `<img>` with its alt. Without it, a grey placeholder. */
  image?: ReactNode;
  /** The message, up to 1024 characters (Figma: `body`). */
  body: ReactNode;
  /** The grey line under the body, up to 60 characters (Figma: `showFooter` + `footer`). */
  footer?: ReactNode;
  time?: string;
  /** android or ios. Inside a WhatsAppChat, the chat's by default. */
  platform?: WhatsAppPlatform;
}

/**
 * WhatsAppTemplate — Figma [RDS] External/WhatsAppTemplate. A MOCKUP of a WhatsApp Business template message, for
 * flows: the header, the body, the footer, the time and the buttons under the bubble. Limits from Meta's
 * documentation. Styles: whatsapp-template.css and internal/whatsapp.css.
 */
export function WhatsAppTemplate({
  children,
  header = 'none',
  headerText,
  image,
  body,
  footer,
  time = '11:59',
  platform,
  className,
  ...rest
}: WhatsAppTemplateProps) {
  const finalPlatform = useWhatsAppPlatform(platform);
  return (
    <div {...rest} className={['rds-whatsapp-template', `rds-whatsapp--${finalPlatform}`, className].filter(Boolean).join(' ')}>
      <div className={['rds-whatsapp-template__content', header === 'image' && 'rds-whatsapp-template__content--image'].filter(Boolean).join(' ')}>
        {header === 'image' && <div className="rds-whatsapp-template__image">{image}</div>}
        {header === 'text' && headerText && <p className="rds-whatsapp-template__header">{headerText}</p>}
        <div className="rds-whatsapp-template__text">
          <p className="rds-whatsapp-template__body">{body}</p>
          {footer && <p className="rds-whatsapp-template__footer">{footer}</p>}
          <p className="rds-whatsapp-template__time">{time}</p>
        </div>
      </div>
      {children && <div className="rds-whatsapp-template__buttons">{children}</div>}
    </div>
  );
}

export type WhatsAppTemplateButtonType = 'quick-reply' | 'url' | 'phone' | 'all-options';
export type WhatsAppTemplateButtonStatus = 'default' | 'used';

export interface WhatsAppTemplateButtonProps extends HTMLAttributes<HTMLDivElement> {
  /** The label, up to 25 characters (Figma: `label`). With all-options, "Ver todas as opções" by default. */
  children?: ReactNode;
  /** quick-reply (a reply), url (a link), phone (a call) or all-options (more than 3 buttons). */
  type?: WhatsAppTemplateButtonType;
  /** used: a quick reply already tapped, in grey. */
  status?: WhatsAppTemplateButtonStatus;
}

const BUTTON_ICONS: Record<WhatsAppTemplateButtonType, () => ReactNode> = {
  'quick-reply': ReplyIcon,
  url: ExternalLinkIcon,
  phone: PhoneIcon,
  'all-options': MoreVerticalIcon,
};

/** One button under a WhatsAppTemplate (Figma: .whatsapp/template-button). A mockup: it does nothing. */
export function WhatsAppTemplateButton({ children, type = 'quick-reply', status = 'default', className, ...rest }: WhatsAppTemplateButtonProps) {
  const Icon = BUTTON_ICONS[type];
  return (
    <div
      {...rest}
      className={['rds-whatsapp-template__button', status === 'used' && 'rds-whatsapp-template__button--used', className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="rds-whatsapp-template__button-icon" aria-hidden="true">
        <Icon />
      </span>
      <span>{children ?? (type === 'all-options' ? 'Ver todas as opções' : null)}</span>
    </div>
  );
}
