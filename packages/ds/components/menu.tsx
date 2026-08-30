'use client';

import { type ReactNode } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { Popover, type PopoverPlacement } from './popover';

/**
 * Menu — popover de ações (DropdownMenu). Inspirado em M3 Menu / shadcn DropdownMenu.
 *
 * Uso:
 *   <Menu trigger={<IconButton icon={<MoreVertical />} aria-label="Ações" />}>
 *     {({ close }) => (
 *       <>
 *         <MenuItem icon={<Edit />} onClick={() => { edit(); close(); }}>Editar</MenuItem>
 *         <MenuItem icon={<Copy />} onClick={...}>Duplicar</MenuItem>
 *         <MenuSeparator />
 *         <MenuItem icon={<Trash />} variant="danger" onClick={...}>Excluir</MenuItem>
 *       </>
 *     )}
 *   </Menu>
 */

export interface MenuProps {
  trigger:    ReactNode;
  children:   ReactNode | ((api: { close: () => void }) => ReactNode);
  placement?: PopoverPlacement;
  /** Largura mínima em px. default = 180. */
  minWidth?:  number;
  className?: string;
  open?:      boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Menu({
  trigger,
  children,
  placement = 'bottom-start',
  minWidth = 180,
  className = '',
  open,
  onOpenChange,
}: MenuProps) {
  return (
    <Popover
      trigger={trigger}
      placement={placement}
      open={open}
      onOpenChange={onOpenChange}
      offset={4}
    >
      {(api) => (
        <div
          role="menu"
          className={[
            'rounded-(--radius-card) border border-stroke-default bg-surface-default shadow-lg',
            'py-1',
            className,
          ].join(' ')}
          style={{ minWidth }}
        >
          {typeof children === 'function' ? children(api) : children}
        </div>
      )}
    </Popover>
  );
}

// ── MenuItem ────────────────────────────────────────────────────────────────

export interface MenuItemProps {
  children:    ReactNode;
  icon?:       ReactNode;
  /** Ícone à direita (ex: ChevronRight pra submenu, atalho de teclado). */
  trailing?:   ReactNode;
  variant?:    'default' | 'danger';
  disabled?:   boolean;
  selected?:   boolean;
  onClick?:    () => void;
}

export function MenuItem({
  children,
  icon,
  trailing,
  variant = 'default',
  disabled = false,
  selected = false,
  onClick,
}: MenuItemProps) {
  const colorClass = variant === 'danger'
    ? 'text-danger-text hover:bg-danger-soft'
    : 'text-fg-primary hover:bg-surface-raised';

  return (
    <button
      type="button"
      role="menuitem"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={[
        'w-full flex items-center gap-2.5 px-3 py-1.5 text-label text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stroke-focus focus-visible:ring-inset focus-visible:bg-surface-raised',
        'disabled:cursor-not-allowed disabled:opacity-50',
        colorClass,
      ].join(' ')}
    >
      {icon && <span className="shrink-0 [&_svg]:size-4">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {selected && <Check size={14} className="shrink-0 text-fg-muted" />}
      {trailing && !selected && <span className="shrink-0 text-fg-muted">{trailing}</span>}
    </button>
  );
}

// ── MenuSeparator ───────────────────────────────────────────────────────────

export function MenuSeparator() {
  return <div role="separator" className="h-px bg-stroke-subtle my-1" />;
}

// ── MenuLabel ───────────────────────────────────────────────────────────────

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
      {children}
    </div>
  );
}

// Re-export pra Menu com submenu (ChevronRight como trailing)
export { ChevronRight as MenuChevron };
