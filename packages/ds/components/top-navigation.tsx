'use client';

import { useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';
import { CloseIcon, MenuIcon } from './internal/icons';

export interface TopNavigationProps extends HTMLAttributes<HTMLElement> {
  /**
   * The brand (Figma: `logo`), always by slot: the design system carries no client logo. Usually a link to the home
   * page named after the brand, around the logotype.
   */
  logo: ReactNode;
  /** The main sections: neutral ghost Buttons as links, through asChild (Figma: slot `links`). */
  links?: ReactNode;
  /** Sign in and the main action: a neutral outline and an action fill Button (Figma: slot `actions`). */
  actions?: ReactNode;
  /** Names the links' navigation. */
  label?: string;
  /** The menu panel open, below 768 of container width (Figma: `open`). Controlled; pair with `onOpenChange`. */
  open?: boolean;
  /** Uncontrolled: the panel open at first. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The menu button's accessible name, closed and open. */
  openLabel?: string;
  closeLabel?: string;
}

/**
 * TopNavigation — Figma [RDS] Blocks/TopNavigation. The top bar of the public pages (<header>, the banner landmark
 * at the top level): logo, links and actions. Below 768 of container width the links and the actions go into the
 * panel the menu button opens (Figma: `screen=mobile`, `open`); Escape closes it and returns the focus to the
 * button. Styles: top-navigation.css.
 */
export function TopNavigation({
  logo,
  links,
  actions,
  label = 'Principal',
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  openLabel = 'Abrir menu',
  closeLabel = 'Fechar menu',
  className,
  onKeyDown,
  ...rest
}: TopNavigationProps) {
  const [own, setOwn] = useState(defaultOpen);
  const open = openProp ?? own;
  const panelId = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const setOpen = (next: boolean) => {
    setOwn(next);
    onOpenChange?.(next);
  };
  return (
    <header
      {...rest}
      className={['rds-topnav', className].filter(Boolean).join(' ')}
      data-open={open ? '' : undefined}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        onKeyDown?.(event);
        if (event.key === 'Escape' && open) {
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <div className="rds-topnav__bar">
        <div className="rds-topnav__brand">{logo}</div>
        <div id={panelId} className="rds-topnav__panel">
          {links && (
            <nav className="rds-topnav__links" aria-label={label}>
              {links}
            </nav>
          )}
          {actions && <div className="rds-topnav__actions">{actions}</div>}
        </div>
        <Tooltip text={open ? closeLabel : openLabel}>
          <IconButton
            ref={toggle}
            className="rds-topnav__toggle"
            icon={open ? <CloseIcon /> : <MenuIcon />}
            label={open ? closeLabel : openLabel}
            tone="neutral"
            variant="ghost"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen(!open)}
          />
        </Tooltip>
      </div>
    </header>
  );
}
