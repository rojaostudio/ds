'use client';

import { type ReactNode } from 'react';
import { Button } from './button';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from './dropdown-menu';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';
import { MoreVerticalIcon } from './internal/icons';

export interface RowActionItem {
  label:     string;
  icon?:     ReactNode;
  /** neutral (default) or danger: danger items go last, after a separator. */
  tone?:     'neutral' | 'danger';
  disabled?: boolean;
  onClick:   () => void;
}

/**
 * RowActions — a composition of the Button (outline, neutral), the IconButton with its Tooltip and the
 * DropdownMenu: the actions at the end of a table row. One action in view, the rest behind "Mais ações"; danger
 * items go last, after a separator. Clicks do not reach the row. Styles: row-actions.css.
 */
export interface RowActionsProps {
  /** Rótulo do botão principal (ex: "Ver detalhes"). */
  primaryLabel: string;
  /** Se href, renderiza <a>; se onClick, renderiza <button>. */
  primaryHref?:    string;
  primaryOnClick?: () => void;
  /** Itens do menu de 3-pontinhos. Se vazio, o menu não é renderizado. */
  items?: RowActionItem[];
  /** Separador antes de itens "danger" (último bloco). default: true quando há danger items. */
  dangerSeparator?: boolean;
}

export function RowActions({
  primaryLabel,
  primaryHref,
  primaryOnClick,
  items = [],
  dangerSeparator,
}: RowActionsProps) {
  const isDanger = (i: RowActionItem) => i.tone === 'danger';
  const hasDanger = items.some(isDanger);
  const showSep   = dangerSeparator ?? hasDanger;

  const normalItems = showSep ? items.filter((i) => !isDanger(i)) : items;
  const dangerItems = showSep ? items.filter(isDanger) : [];

  return (
    <div className="rds-row-actions">
      {primaryHref ? (
        <Button asChild variant="outline" tone="neutral">
          <a href={primaryHref} onClick={(e) => e.stopPropagation()}>
            {primaryLabel}
          </a>
        </Button>
      ) : primaryOnClick ? (
        <Button
          variant="outline"
          tone="neutral"
          onClick={(e) => {
            e.stopPropagation();
            primaryOnClick();
          }}
        >
          {primaryLabel}
        </Button>
      ) : null}

      {items.length > 0 && (
        <div className="rds-row-actions__more" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu
            trigger={
              <Tooltip text="Mais ações">
                <IconButton
                  icon={<MoreVerticalIcon />}
                  label="Mais ações"
                  variant="ghost"
                  tone="neutral"
                />
              </Tooltip>
            }
            align="end"
          >
            {normalItems.map((item, i) => (
              <DropdownMenuItem
                key={i}
                icon={item.icon}
                tone={isDanger(item) ? 'danger' : 'neutral'}
                disabled={item.disabled}
                onSelect={item.onClick}
              >
                {item.label}
              </DropdownMenuItem>
            ))}
            {showSep && dangerItems.length > 0 && <DropdownMenuSeparator />}
            {dangerItems.map((item, i) => (
              <DropdownMenuItem
                key={`d-${i}`}
                icon={item.icon}
                tone="danger"
                disabled={item.disabled}
                onSelect={item.onClick}
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
