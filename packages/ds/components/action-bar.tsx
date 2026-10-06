'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';
import { CloseIcon } from './internal/icons';

export interface ActionBarProps extends HTMLAttributes<HTMLDivElement> {
  /** How many are selected, as shown and announced ("3 selecionados") (Figma: `count`). */
  count: ReactNode;
  /**
   * The actions (Figma: slot `actions`). Use `tone="neutral" variant="ghost"` Buttons: on the bar their label and icon
   * are actionbar/text (the bar redeclares the neutral ghost's tokens in its own colours, in light and in dark).
   */
  children: ReactNode;
  /** Shows the X that clears the selection and is called when it is pressed (Figma: `showClear`). */
  onClear?: () => void;
  /** The X's accessible name. */
  clearLabel?: string;
}

/**
 * ActionBar — Figma [RDS] Actions/ActionBar. The bulk action bar: it shows while items are selected and
 * leaves when the selection is cleared. It does not place itself: put it sticky or fixed at the foot of
 * the area. Styles: action-bar.css.
 */
export function ActionBar({
  count,
  children,
  onClear,
  clearLabel = 'Limpar seleção',
  className,
  ...rest
}: ActionBarProps) {
  return (
    <div
      role="region"
      aria-label="Ações da seleção"
      {...rest}
      className={['rds-actionbar', className].filter(Boolean).join(' ')}
    >
      <span className="rds-actionbar__count" aria-live="polite">
        {count}
      </span>
      <span className="rds-actionbar__divider" aria-hidden="true" />
      <div className="rds-actionbar__actions">
        {children}
        {onClear && (
          <Tooltip text={clearLabel}>
            <IconButton
              className="rds-actionbar__clear"
              icon={<CloseIcon />}
              label={clearLabel}
              tone="neutral"
              variant="ghost"
              onClick={onClear}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
}
