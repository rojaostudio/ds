import type { HTMLAttributes, ReactNode } from 'react';

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  /** One key (Figma: `label`): Ctrl, Enter, ⌘. For a symbol, add aria-label with its name ("Command"). */
  children: ReactNode;
}

/** Kbd — Figma [RDS] Content/Kbd. One keyboard key, for shortcuts. A combination is a KbdGroup. Styles: kbd.css. */
export function Kbd({ className, children, ...rest }: KbdProps) {
  return (
    <kbd {...rest} className={['rds-kbd', className].filter(Boolean).join(' ')}>
      {children}
    </kbd>
  );
}

export interface KbdGroupProps extends HTMLAttributes<HTMLElement> {
  /** The keys, one Kbd each, with "+" between them as text. */
  children: ReactNode;
}

/** A key combination: <kbd><kbd>Ctrl</kbd>+<kbd>K</kbd></kbd>, the HTML way to write it. */
export function KbdGroup({ className, children, ...rest }: KbdGroupProps) {
  return (
    <kbd {...rest} className={['rds-kbd-group', className].filter(Boolean).join(' ')}>
      {children}
    </kbd>
  );
}
