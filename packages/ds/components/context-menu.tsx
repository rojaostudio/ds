'use client';

import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import * as Menu from '@radix-ui/react-context-menu';
import { MenuItemContent, menuItemClassName, type MenuItemContentProps, type MenuItemTone } from './internal/menu';

export type ContextMenuItemTone = MenuItemTone;

export interface ContextMenuProps {
  /**
   * The area it opens on (one element). Make it focusable (tabIndex={0}, or a control) so the keyboard can open
   * the menu too, with the menu key or Shift+F10.
   */
  children: ReactElement;
  /** The ContextMenuItems, with a ContextMenuSeparator between groups. */
  items: ReactNode;
  /** Turns it off: the right click shows the browser's menu again. */
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The menu's name for screen readers. */
  'aria-label'?: string;
  className?: string;
}

/** Opens the menu from the keyboard: the menu key and Shift+F10 become a contextmenu at the element's corner. */
function openFromKeyboard(event: KeyboardEvent<HTMLElement>) {
  const isMenuKey = event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');
  if (!isMenuKey) return;
  event.preventDefault();
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.dispatchEvent(
    new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + Math.min(rect.width, 16),
      clientY: rect.top + Math.min(rect.height, 16),
    }),
  );
}

/**
 * ContextMenu — Figma [RDS] Overlays/ContextMenu (spec only: the DropdownMenu's look, opened by the right click,
 * a long touch, the menu key or Shift+F10). Radix ContextMenu: role="menu" at the pointer; the arrows move,
 * Enter chooses, Escape closes. It is never the only way to an action: every item also lives on the screen or in a
 * DropdownMenu. Styles: internal/menu.css.
 */
export function ContextMenu({ children, items, disabled, onOpenChange, className, 'aria-label': ariaLabel }: ContextMenuProps) {
  return (
    // Not modal, as the DropdownMenu: the page is not hidden from screen readers while the menu is open.
    <Menu.Root onOpenChange={onOpenChange} modal={false}>
      <Menu.Trigger asChild disabled={disabled} onKeyDown={disabled ? undefined : openFromKeyboard}>
        {children}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          collisionPadding={8}
          aria-label={ariaLabel}
          className={['rds-menu', 'rds-context-menu', className].filter(Boolean).join(' ')}
        >
          {items}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

export interface ContextMenuItemProps extends MenuItemContentProps {
  /** Runs when the item is chosen; the menu then closes. */
  onSelect?: () => void;
  /**
   * neutral (default), or danger for what destroys: last, after a separator (Figma: `tone`).
   */
  tone?: ContextMenuItemTone;
  disabled?: boolean;
  textValue?: string;
}

/** One action (Figma .menu/item): role="menuitem". */
export function ContextMenuItem({ children, icon, shortcut, onSelect, tone, disabled, textValue }: ContextMenuItemProps) {
  return (
    <Menu.Item onSelect={onSelect} disabled={disabled} textValue={textValue} className={menuItemClassName(tone)}>
      <MenuItemContent icon={icon} shortcut={shortcut}>
        {children}
      </MenuItemContent>
    </Menu.Item>
  );
}

/** The line between groups of actions. */
export function ContextMenuSeparator() {
  return <Menu.Separator className="rds-menu__separator" />;
}
