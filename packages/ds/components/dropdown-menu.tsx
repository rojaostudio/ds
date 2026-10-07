'use client';

import type { ReactElement, ReactNode } from 'react';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { CheckIcon } from './internal/icons';
import { MenuCheckBox, MenuItemContent, menuItemClassName, type MenuItemContentProps, type MenuItemTone } from './internal/menu';

export type DropdownMenuAlign = 'start' | 'center' | 'end';
export type DropdownMenuSide = 'top' | 'bottom' | 'left' | 'right';
export type DropdownMenuItemTone = MenuItemTone;

export interface DropdownMenuProps {
  /** The button that opens it, usually the "⋯" IconButton named after the item whose actions it lists. */
  trigger: ReactElement;
  /** The DropdownMenuItems, with a DropdownMenuSeparator between groups (Figma: the `items` slot). */
  children: ReactNode;
  /** Where it lines up with the button: start (its left edge), end (its right edge). */
  align?: DropdownMenuAlign;
  side?: DropdownMenuSide;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The menu's name, when the trigger's own name doesn't say it. */
  'aria-label'?: string;
  className?: string;
}

/**
 * DropdownMenu — Figma [RDS] Overlays/DropdownMenu. The actions of an item that don't fit on the screen (Radix
 * DropdownMenu): role="menu"; the focus goes to the first item; the arrows move (disabled items are skipped),
 * typing a letter jumps, Enter or Space chooses, Escape closes and gives the focus back to the button.
 * Up to 7 items; the one that destroys goes last, after a separator. Styles: internal/menu.css.
 */
export function DropdownMenu({
  trigger,
  children,
  align = 'start',
  side = 'bottom',
  open,
  defaultOpen,
  onOpenChange,
  className,
  'aria-label': ariaLabel,
}: DropdownMenuProps) {
  return (
    // Not modal: the page is not hidden from screen readers (aria-hidden over the focusable trigger) nor locked; a
    // click outside, Escape or Tab still close it, and the focus goes back to the trigger.
    <Menu.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} modal={false}>
      <Menu.Trigger asChild>{trigger}</Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align={align}
          side={side}
          sideOffset={4}
          collisionPadding={8}
          aria-label={ariaLabel}
          className={['rds-menu', 'rds-dropdown-menu', className].filter(Boolean).join(' ')}
        >
          {children}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

export interface DropdownMenuItemProps extends MenuItemContentProps {
  /** Runs when the item is chosen (click, Enter or Space); the menu then closes. A destructive action asks first (AlertDialog). */
  onSelect?: () => void;
  /**
   * neutral (default), or danger for what destroys: last, after a separator (Figma: `tone`).
   */
  tone?: DropdownMenuItemTone;
  /** Stays in the list, can't be chosen, and the arrows skip it. */
  disabled?: boolean;
  /** The text typing jumps by, when the label is not plain text. */
  textValue?: string;
  /** Render the single child element (a link) as the item: a place to go instead of an action. */
  asChild?: boolean;
}

/** One action (Figma .menu/item): role="menuitem". */
export function DropdownMenuItem({ children, icon, count, shortcut, onSelect, tone, disabled, textValue, asChild }: DropdownMenuItemProps) {
  if (asChild) {
    return (
      <Menu.Item asChild onSelect={onSelect} disabled={disabled} textValue={textValue} className={menuItemClassName(tone)}>
        {children}
      </Menu.Item>
    );
  }
  return (
    <Menu.Item onSelect={onSelect} disabled={disabled} textValue={textValue} className={menuItemClassName(tone)}>
      <MenuItemContent icon={icon} count={count} shortcut={shortcut}>
        {children}
      </MenuItemContent>
    </Menu.Item>
  );
}

export interface DropdownMenuRadioGroupProps {
  /** The chosen item's value. */
  value: string;
  onValueChange: (value: string) => void;
  /** The DropdownMenuRadioItems. */
  children: ReactNode;
}

/** A group of items of which one is chosen (a filter's options): role="group" of menuitemradio. */
export function DropdownMenuRadioGroup({ value, onValueChange, children }: DropdownMenuRadioGroupProps) {
  return (
    <Menu.RadioGroup value={value} onValueChange={onValueChange}>
      {children}
    </Menu.RadioGroup>
  );
}

export interface DropdownMenuRadioItemProps extends MenuItemContentProps {
  value: string;
  disabled?: boolean;
  textValue?: string;
}

/** One option of a DropdownMenuRadioGroup: role="menuitemradio", aria-checked; the chosen one shows a check. */
export function DropdownMenuRadioItem({ value, children, icon, count, shortcut, disabled, textValue }: DropdownMenuRadioItemProps) {
  return (
    <Menu.RadioItem value={value} disabled={disabled} textValue={textValue} className={menuItemClassName()}>
      <MenuItemContent icon={icon} count={count} shortcut={shortcut}>
        {children}
      </MenuItemContent>
      <Menu.ItemIndicator className="rds-menu__check" aria-hidden="true">
        <CheckIcon />
      </Menu.ItemIndicator>
    </Menu.RadioItem>
  );
}

export interface DropdownMenuCheckboxItemProps extends Omit<MenuItemContentProps, 'icon'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** The text typing jumps by. Give it when there is a `count`, or the count joins the label ("Laser3"). */
  textValue?: string;
  /** Close the menu when it is toggled. Off by default: several are ticked in a row (a filter, the columns shown). */
  closeOnSelect?: boolean;
}

/**
 * An option that is ticked on or off (Figma .menu/check-item): role="menuitemcheckbox", aria-checked; the Checkbox's
 * box, the label and the count on the right. Ticking (click, Enter or Space) keeps the menu open, unless closeOnSelect.
 */
export function DropdownMenuCheckboxItem({
  checked,
  onCheckedChange,
  children,
  count,
  shortcut,
  disabled,
  textValue,
  closeOnSelect = false,
}: DropdownMenuCheckboxItemProps) {
  return (
    <Menu.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      onSelect={closeOnSelect ? undefined : (event) => event.preventDefault()}
      disabled={disabled}
      textValue={textValue}
      className={menuItemClassName()}
    >
      <MenuCheckBox checked={checked} disabled={disabled} />
      <MenuItemContent count={count} shortcut={shortcut}>
        {children}
      </MenuItemContent>
    </Menu.CheckboxItem>
  );
}

/** The line between groups of actions (Figma: the Separator in the `items` slot). */
export function DropdownMenuSeparator() {
  return <Menu.Separator className="rds-menu__separator" />;
}
