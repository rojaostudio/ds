'use client';

import { cloneElement, isValidElement, useRef, useState, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { Button, type ButtonProps } from './button';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';
import { focusAfter } from './internal/focus-after';
import { CloseIcon, MegaphoneIcon } from './internal/icons';

/** neutral (default): a piece of news. attention: something the person should act on soon, such as a trial ending. */
export type BannerTone = 'neutral' | 'attention';
/** How close it is (tone="attention"): low, medium, high, each a more saturated amber. Never red: it is not an error. */
export type BannerLevel = 'low' | 'medium' | 'high';

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  /** Decorative (Figma: `showIcon` + `icon`). By default a megaphone; `null` hides it. */
  icon?: ReactNode;
  /** The highlight before the message, such as "Novidade:" (Figma: `highlight`). */
  highlight?: ReactNode;
  /** The message, one short line (Figma: `message`). */
  message: ReactNode;
  /**
   * An action Button, or a link through Button asChild (Figma: `showAction`). neutral: a ghost Button. attention:
   * the Banner sets the Button's variant, outline in low and medium, fill in high, in the strip's own colours.
   */
  action?: ReactNode;
  /** Shows the × (Figma: `showClose`). The Banner hides itself, calls this, and the focus moves on. */
  onClose?: () => void;
  /** The ×'s accessible name. */
  closeLabel?: string;
  /** Names the strip for screen readers (a region landmark). */
  label?: string;
  /** neutral (default) or attention (Figma: `tone`). */
  tone?: BannerTone;
  /**
   * Only with tone="attention" (Figma: `level`): low (default), medium, high. The background is the theme's
   * surface/attention/<level> (amber/100, 200, 400, the same in light, dark and on the plate), the text black.
   */
  level?: BannerLevel;
}

/**
 * Banner — Figma [RDS] Blocks/Banner. The notice strip on top of the site or the app: a short piece of news, or
 * (tone="attention") something to act on soon, in three levels. An error or a status is the Alert. The layout follows
 * the container's width, never a prop: below 640 the text and the action stack (Figma: screen=mobile).
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
  tone = 'neutral',
  level = 'low',
  className,
  ...rest
}: BannerProps) {
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  if (!open) return null;
  const attention = tone === 'attention';
  // attention: the CTA's weight follows the level (outline in low and medium, fill in high).
  const cta =
    attention && isValidElement(action) && action.type === Button
      ? cloneElement(action as ReactElement<ButtonProps>, { tone: 'neutral', variant: level === 'high' ? 'fill' : 'outline' })
      : action;
  return (
    <div
      ref={ref}
      role="region"
      aria-label={label}
      {...rest}
      className={['rds-banner', attention && `rds-banner--attention rds-banner--${level}`, className].filter(Boolean).join(' ')}
    >
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
            {cta && <div className="rds-banner__action">{cta}</div>}
          </div>
        </div>
        {onClose && (
          <Tooltip text={closeLabel}>
            <IconButton
              icon={<CloseIcon />}
              label={closeLabel}
              tone="neutral"
              variant="ghost"
              className="rds-banner__close"
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
