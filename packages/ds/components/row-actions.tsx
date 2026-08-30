'use client';

import { type ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';
import { Menu, MenuItem, MenuSeparator } from './menu';
import { IconButton } from './icon-button';

export interface RowActionItem {
  label:     string;
  icon?:     ReactNode;
  variant?:  'default' | 'danger';
  disabled?: boolean;
  onClick:   () => void;
}

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
  const hasDanger = items.some((i) => i.variant === 'danger');
  const showSep   = dangerSeparator ?? hasDanger;

  const normalItems = showSep ? items.filter((i) => i.variant !== 'danger') : items;
  const dangerItems = showSep ? items.filter((i) => i.variant === 'danger')  : [];

  const primaryCls =
    'inline-flex items-center gap-1 text-caption font-medium border border-stroke-default rounded-(--radius-control) px-2.5 py-1 text-fg-secondary hover:bg-surface-page hover:border-stroke-strong transition-colors whitespace-nowrap';

  return (
    <div className="flex items-center justify-end gap-1">
      {primaryHref ? (
        <a href={primaryHref} className={primaryCls} onClick={(e) => e.stopPropagation()}>
          {primaryLabel}
        </a>
      ) : primaryOnClick ? (
        <button
          type="button"
          className={primaryCls}
          onClick={(e) => { e.stopPropagation(); primaryOnClick(); }}
        >
          {primaryLabel}
        </button>
      ) : null}

      {items.length > 0 && (
        <div onClick={(e) => e.stopPropagation()}>
          <Menu
            trigger={
              <IconButton
                icon={<MoreVertical />}
                aria-label="Mais ações"
                size="sm"
                variant="ghost"
                color="secondary"
              />
            }
            placement="bottom-end"
            minWidth={160}
          >
            {({ close }) => (
              <>
                {normalItems.map((item, i) => (
                  <MenuItem
                    key={i}
                    icon={item.icon}
                    variant={item.variant}
                    disabled={item.disabled}
                    onClick={() => { item.onClick(); close(); }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
                {showSep && dangerItems.length > 0 && <MenuSeparator />}
                {dangerItems.map((item, i) => (
                  <MenuItem
                    key={`d-${i}`}
                    icon={item.icon}
                    variant="danger"
                    disabled={item.disabled}
                    onClick={() => { item.onClick(); close(); }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </>
            )}
          </Menu>
        </div>
      )}
    </div>
  );
}
