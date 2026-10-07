// The menu item (Figma .menu/item), shared by DropdownMenu, ContextMenu and Command: the classes and the inside
// (icon, label, count, shortcut). Each component wraps it in its own Radix item. Not exported from the package.
import type { ReactNode } from 'react';
import { CheckIcon } from './icons';

/** neutral (default) or danger (Figma: `tone`). */
export type MenuItemTone = 'neutral' | 'danger';

export interface MenuItemContentProps {
  /** The action, a verb ("Duplicar") (Figma: `label`). */
  children: ReactNode;
  /** An icon before the label (Figma: `showIcon` + `icon`). Decorative. */
  icon?: ReactNode;
  /** How many items the option holds, on the right (Figma: `showCount` + `count`, .menu/check-item). Announced with the label. */
  count?: ReactNode;
  /** A keyboard shortcut shown on the right (Figma: `showShortcut`), such as "Ctrl D". Not announced. */
  shortcut?: ReactNode;
}

export const menuItemClassName = (tone: MenuItemTone = 'neutral', extra?: string) =>
  ['rds-menu__item', tone === 'danger' && 'rds-menu__item--danger', extra].filter(Boolean).join(' ');

export function MenuItemContent({ children, icon, count, shortcut }: MenuItemContentProps) {
  return (
    <>
      {icon && (
        <span className="rds-menu__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="rds-menu__label">{children}</span>
      {count !== undefined && count !== null && count !== '' && <span className="rds-menu__count">{count}</span>}
      {shortcut && (
        <kbd className="rds-menu__shortcut" aria-hidden="true">
          {shortcut}
        </kbd>
      )}
    </>
  );
}

/**
 * The Checkbox's box alone (Figma .menu/check-item: the Checkbox without its label), for a menuitemcheckbox: the
 * item is the control and carries aria-checked, the box only shows it. Styles: checkbox.css (standalone).
 */
export function MenuCheckBox({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <span
      className="rds-checkbox__box rds-checkbox__box--standalone"
      data-checked={checked || undefined}
      data-disabled={disabled || undefined}
      aria-hidden="true"
    >
      <span className="rds-checkbox__check">
        <CheckIcon />
      </span>
    </span>
  );
}
