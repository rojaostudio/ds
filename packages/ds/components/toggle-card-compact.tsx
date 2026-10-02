'use client';

import type { ReactNode } from 'react';
import { IconButton } from './icon-button';
import { PencilIcon } from './internal/icons';
import { Item } from './item';
import { Switch } from './switch';
import { Tooltip } from './tooltip';

export interface ToggleCardCompactProps {
  /** An icon before the text (the Item's media). */
  icon?: ReactNode;
  /** The setting it turns on (the Item's title and the Switch's name). */
  label: string;
  /** The line under the label while off. */
  description?: ReactNode;
  /** The line under the label while on (a summary of what is set); it replaces `description`. */
  summary?: ReactNode;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Shows the pencil (an IconButton) while on: opens the setting's options (a Dialog). */
  onEdit?: () => void;
  /** The pencil's accessible name and tooltip. */
  editLabel?: string;
  /** Submits 'on' (or '') under this name with a native form, through a hidden input. */
  name?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * ToggleCardCompact — a composition of the Item (outline), the Switch and the IconButton with its Tooltip: a
 * setting in one row, its summary under the label while on and a pencil that opens its options. Styles:
 * toggle-card-compact.css.
 */
export function ToggleCardCompact({
  icon,
  label,
  description,
  summary,
  checked,
  onCheckedChange,
  onEdit,
  editLabel = 'Editar',
  name,
  disabled,
  className,
}: ToggleCardCompactProps) {
  return (
    <Item
      variant="outline"
      className={['rds-toggle-card-compact', className].filter(Boolean).join(' ')}
      media={icon}
      title={label}
      description={(checked ? summary : description) || undefined}
      action={
        <span className="rds-toggle-card-compact__actions">
          {name && <input type="hidden" name={name} value={checked ? 'on' : ''} />}
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
