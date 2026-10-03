// The menu item (Figma .menu/item), shared by DropdownMenu, ContextMenu and Command: the classes and the inside
// (icon, label, shortcut). Each component wraps it in its own Radix item. Not exported from the package.
import type { ReactNode } from 'react';

/** neutral (default) or danger (Figma: `tone`). */
export type MenuItemTone = 'neutral' | 'danger';

export interface MenuItemContentProps {
  /** The action, a verb ("Duplicar") (Figma: `label`). */
  children: ReactNode;
  /** An icon before the label (Figma: `showIcon` + `icon`). Decorative. */
  icon?: ReactNode;
  /** A keyboard shortcut shown on the right (Figma: `showShortcut`), such as "Ctrl D". Not announced. */
  shortcut?: ReactNode;
}

export const menuItemClassName = (tone: MenuItemTone | 'default' = 'neutral', extra?: string) =>
  ['rds-menu__item', tone === 'danger' && 'rds-menu__item--danger', extra].filter(Boolean).join(' ');

export function MenuItemContent({ children, icon, shortcut }: MenuItemContentProps) {
  return (
    <>
      {icon && (
        <span className="rds-menu__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="rds-menu__label">{children}</span>
      {shortcut && (
        <kbd className="rds-menu__shortcut" aria-hidden="true">
          {shortcut}
        </kbd>
      )}
    </>
  );
}

