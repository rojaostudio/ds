'use client';

import { useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';
import { focusAfter } from './internal/focus-after';
import { AlertIcon, CircleCheckIcon, CloseIcon, InfoIcon, TriangleAlertIcon } from './internal/icons';

export type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
/** The icon's own colour on a neutral Alert (Figma: `iconTone`). */
export type AlertIconTone = 'info' | 'success' | 'warning' | 'danger';
/** stacked (default): the description under the title. inline: one run of text, the description after the title. */
export type AlertLayout = 'stacked' | 'inline';

const ICONS: Record<AlertTone, () => ReactNode> = {
  neutral: InfoIcon,
  info: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  danger: AlertIcon,
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** danger went wrong; warning can still be avoided; success went right; info and neutral only inform. */
  tone?: AlertTone;
  /** What happened, in one line (Figma: `title`). */
  title: ReactNode;
  /** What to do about it (Figma: `showDescription` + `description`). */
  description?: ReactNode;
  /** The tone's icon (Figma: `showIcon`). Decorative: the title says the same in words. */
  showIcon?: boolean;
  /** Your own icon in place of the tone's (Figma: `icon`), such as a check. Decorative. */
  icon?: ReactNode;
  /**
   * Only with tone="neutral": paints the icon alone in a state's colour (the tone's alert/<tone>/foreground), the
   * strip stays neutral. "Você já pode vender" with a green check: `icon={<CheckIcon />} iconTone="success"`.
   */
  iconTone?: AlertIconTone;
  /**
   * stacked (default): the description under the title. inline: the title and the description on one line, as one
   * sentence that wraps where the words do when it does not fit (Figma: `layout`).
   */
  layout?: AlertLayout;
  /**
   * One way out (Figma: `showAction`), usually a neutral outline `size="sm"` Button or a link rendered with Button
   * asChild. Below lg 1024 it sits under the description; from 1024 it moves to the right of the text, centred.
   */
  action?: ReactNode;
  /**
   * Lets the person dismiss it (Figma: `showClose`): an × named by `closeLabel`. The Alert hides itself, calls
   * this, and the focus moves to what comes next on the page.
   */
  onClose?: () => void;
  /** The ×'s accessible name. */
  closeLabel?: string;
  /**
   * How it is announced. none (default): already on the page when it loads. status: it appears after
   * something, calmly (role="status"). alert: it appears after an action and is urgent (role="alert").
   */
  announce?: 'none' | 'status' | 'alert';
}

/**
 * Alert — Figma [RDS] Feedback/Alert. A message that stays on the screen, inside the content, while the situation
 * lasts: what happened and what to do. One per screen. A short confirmation after an action is a Toast.
 * Styles: alert.css.
 */
export function Alert({
  tone = 'neutral',
  title,
  description,
  showIcon = true,
  icon,
  iconTone,
  layout = 'stacked',
  action,
  onClose,
  closeLabel = 'Fechar aviso',
  announce = 'none',
  className,
  ...rest
}: AlertProps) {
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  if (!open) return null;
  const Icon = ICONS[tone];
  return (
    <div
      ref={ref}
      role={announce === 'none' ? undefined : announce}
      {...rest}
      className={['rds-alert', `rds-alert--${tone}`, layout === 'inline' && 'rds-alert--inline', className]
        .filter(Boolean)
        .join(' ')}
    >
      {showIcon && (
        <span
          className={['rds-alert__icon', tone === 'neutral' && iconTone && `rds-alert__icon--${iconTone}`].filter(Boolean).join(' ')}
          aria-hidden="true"
        >
          {icon ?? <Icon />}
        </span>
      )}
      <div className="rds-alert__content">
        <div className="rds-alert__text">
          <p className="rds-alert__title">{title}</p>
          {/* inline: the space between the title and the description (a flex container drops it when stacked). */}
          {description && ' '}
          {description && <div className="rds-alert__description">{description}</div>}
        </div>
        {action && <div className="rds-alert__action">{action}</div>}
      </div>
      {onClose && (
        <Tooltip text={closeLabel}>
          <IconButton
            icon={<CloseIcon />}
            label={closeLabel}
            tone="neutral"
            variant="ghost"
            className="rds-alert__close"
            onClick={() => {
              focusAfter(ref.current);
              setOpen(false);
              onClose();
            }}
          />
        </Tooltip>
      )}
    </div>
  );
}
