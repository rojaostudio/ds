'use client';

import type { ReactNode } from 'react';
import { Card } from './card';
import { IconButton } from './icon-button';
import { PencilIcon } from './internal/icons';
import { Item } from './item';
import { Switch } from './switch';
import { Tooltip } from './tooltip';

/** Figma [RDS] Forms/ToggleCard `layout`: the Card with the options below it, or one row (the Item). */
export type ToggleCardLayout = 'default' | 'compact';

export interface ToggleCardProps {
  /** `default`: a Card with the Switch and, while on, the options below it. `compact`: one row (an outline Item). */
  layout?: ToggleCardLayout;
  /** The setting it turns on (the Switch's label; in compact, the Item's title and the Switch's name). */
  label: string;
  /** A line under the label (default: the Switch's hint; compact: shown while off). */
  description?: ReactNode;
  /** Compact only: the line under the label while on (a summary of what is set); it replaces `description`. */
  summary?: ReactNode;
  /** Compact only: an icon before the text (the Item's media). */
  icon?: ReactNode;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Compact only: shows the pencil (an IconButton) while on; it opens the setting's options (a Dialog). */
  onEdit?: () => void;
  /** Compact only: the pencil's accessible name and tooltip. Default "Editar". */
  editLabel?: string;
  /** Submits 'on' (or '') under this name with a native form, through a hidden input. */
  name?: string;
  /** Default only: the setting's options, shown under it while it is on. */
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * ToggleCard — Figma [RDS] Forms/ToggleCard: a setting that, when on, opens its own options. `layout="default"` is
 * a composition of the Card and the Switch, the options below it; `layout="compact"` is one row (the Item outline,
 * the Switch and the IconButton with its Tooltip): the summary under the label while on and a pencil that opens the
 * options. Styles: toggle-card.css.
 */
export function ToggleCard({
  layout = 'default',
  label,
  description,
  summary,
  icon,
  checked,
  onCheckedChange,
  onEdit,
  editLabel = 'Editar',
  name,
  children,
  disabled,
  className,
}: ToggleCardProps) {
  const hidden = name && <input type="hidden" name={name} value={checked ? 'on' : ''} />;

  if (layout === 'compact') {
    return (
      <Item
        variant="outline"
        className={['rds-toggle-card', 'rds-toggle-card--compact', className].filter(Boolean).join(' ')}
        media={icon}
        title={label}
        description={(checked ? summary : description) || undefined}
        action={
          <span className="rds-toggle-card__actions">
            {hidden}
            {checked && onEdit && (
              <Tooltip text={editLabel}>
                <IconButton icon={<PencilIcon />} label={editLabel} variant="ghost" tone="neutral" onClick={onEdit} disabled={disabled} />
              </Tooltip>
            )}
            <Switch aria-label={label} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
          </span>
        }
      />
    );
  }

  return (
    <Card as="div" className={['rds-toggle-card', className].filter(Boolean).join(' ')}>
      {hidden}
      <div className="rds-toggle-card__header">
        <Switch checked={checked} onCheckedChange={onCheckedChange} hint={description} disabled={disabled}>
          {label}
        </Switch>
      </div>
      {checked && children && <div className="rds-toggle-card__content">{children}</div>}
    </Card>
  );
}
