'use client';

import { useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';
import { focusAfter } from './internal/focus-after';
import { CloseIcon, MegaphoneIcon } from './internal/icons';

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  /** Decorative (Figma: `showIcon` + `icon`). By default a megaphone; `null` hides it. */
  icon?: ReactNode;
  /** The highlight before the message, such as "Novidade:" (Figma: `highlight`). */
  highlight?: ReactNode;
  /** The message, one short line (Figma: `message`). */
  message: ReactNode;
  /** An action ghost Button, or a link through Button asChild (Figma: `showAction`). */
  action?: ReactNode;
  /** Shows the × (Figma: `showClose`). The Banner hides itself, calls this, and the focus moves on. */
  onClose?: () => void;
  /** The ×'s accessible name. */
  closeLabel?: string;
  /** Names the strip for screen readers (a region landmark). */
  label?: string;
}

/**
 * Banner — Figma [RDS] Blocks/Banner. The notice strip on top of the site: a short piece of news. An error or a
 * status is the Alert. Below 640 of container width the text and the action stack (Figma: screen=mobile).
 * Styles: banner.css.
 */
export function Banner({
  icon = <MegaphoneIcon />,
  highlight,
  message,
  action,
  onClose,
  closeLabel = 'Fechar aviso',
  label = 'Aviso',
  className,
  ...rest
}: BannerProps) {
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  if (!open) return null;
  return (
    <div ref={ref} role="region" aria-label={label} {...rest} className={['rds-banner', className].filter(Boolean).join(' ')}>
      <div className="rds-banner__inner">
        <div className="rds-banner__content">
          {icon && (
            <span className="rds-banner__icon" aria-hidden="true">
              {icon}
            </span>
          )}
          <div className="rds-banner__body">
            <p className="rds-banner__text">
              {highlight && <strong className="rds-banner__highlight">{highlight}</strong>}
              {highlight && ' '}
              <span className="rds-banner__message">{message}</span>
            </p>
            {action && <div className="rds-banner__action">{action}</div>}
          </div>
        </div>
        {onClose && (
          <Tooltip text={closeLabel}>
            <IconButton
              icon={<CloseIcon />}
              label={closeLabel}
              tone="neutral"
              variant="ghost"
              onClick={() => {
                focusAfter(ref.current);
                setOpen(false);
                onClose();
              }}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
}
