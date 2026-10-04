'use client';

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
  useState,
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Avatar } from './avatar';
import { ChevronDownIcon } from './internal/icons';
import { Separator } from './separator';
import { Tooltip } from './tooltip';

export type SidebarHeader = 'mark' | 'logo';

const SidebarContext = createContext<{ collapsed: boolean }>({ collapsed: false });

export interface SidebarProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /**
   * mark (default): the brand's square mark and the module's name. logo: the product's official logo, given in
   * `logo`. The DS carries no client logo: both come in through slots.
   */
  header?: SidebarHeader;
  /** The product's logo, for header="logo" (Figma: `logo`). Give it its accessible name (an <img alt>, an svg title). */
  logo?: ReactNode;
  /** The brand mark, for header="mark". By default a brand Avatar with the module's first letter. */
  mark?: ReactNode;
  /** The module's name beside the mark (Figma: `module`). Collapsed, it stays for screen readers. */
  module?: string;
  /** Who is signed in, at the foot (Figma: `user`). Collapsed, it stays for screen readers. */
  user?: ReactNode;
  /** 64 wide with only the icons, for a tablet; each entry keeps its name and shows it in a Tooltip. */
  collapsed?: boolean;
  /** The entries (Figma: the `items` slot): SidebarItem, SidebarSection, SidebarSeparator. */
  children: ReactNode;
  /** The foot, under the user: usually the "Sair" SidebarItem. */
  footer?: ReactNode;
}

/**
 * Sidebar — Figma [RDS] Navigation/Sidebar. The product's main navigation, fixed on the left: a <nav> named
 * "Navegação principal" (override with aria-label) with a list; the current entry has aria-current="page".
 * The theme is not a prop: the Sidebar follows its container. For the brand-coloured bar (the old `tone="dark"`),
 * put it inside a `.ds-plate` (the brand mode); for the dark theme, inside `.dark`. Styles: sidebar.css.
 */
export function Sidebar({
  header = 'mark',
  logo,
  mark,
  module,
  user,
  collapsed = false,
  children,
  footer,
  className,
  ...rest
}: SidebarProps) {
  const hideWhenCollapsed = (on: string) => (collapsed ? 'rds-visually-hidden' : on);
  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <nav
        aria-label="Navegação principal"
        {...rest}
        className={['rds-sidebar', collapsed && 'rds-sidebar--collapsed', className]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="rds-sidebar__header">
          {header === 'logo' ? (
            <span className="rds-sidebar__logo">{logo}</span>
          ) : (
            <>
              <span className="rds-sidebar__mark" aria-hidden="true">
                {mark ?? <Avatar type="brand" size="sm" fallbackText={module?.charAt(0).toUpperCase()} />}
              </span>
              {module && <span className={hideWhenCollapsed('rds-sidebar__module')}>{module}</span>}
            </>
          )}
        </div>
        <ul className="rds-sidebar__items">{children}</ul>
        {(user || footer) && (
          <div className="rds-sidebar__account">
            {user && <p className={hideWhenCollapsed('rds-sidebar__user')}>{user}</p>}
            {footer && <ul className="rds-sidebar__items">{footer}</ul>}
          </div>
        )}
      </nav>
    </SidebarContext.Provider>
  );
}

export interface SidebarItemProps {
  /**
   * The entry's name (Figma: `label`). Collapsed, it stays as the accessible name and shows in a Tooltip. With
   * `asChild`, a single link element (an `<a>`, a framework `Link`) whose text is the name.
   */
  children: ReactNode;
  /** The icon (20). Decorative: the name says what the entry is. */
  icon: ReactNode;
  /** A link: where the entry leads. Without `href` nor `asChild`, the entry is a button (Sair). */
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  /** The current page (Figma: `current`): aria-current="page". Only one at a time. */
  current?: boolean;
  /** A number on the right, such as pending items (Figma: `showCount` + `count`). Hidden when collapsed. */
  count?: number | string;
  /** Render the single child element (a framework `Link`) as the entry, with the entry's classes and content. */
  asChild?: boolean;
}

/** One entry (Figma: .sidebar/item): 44 tall, icon of 20. */
export function SidebarItem({ children, icon, href, onClick, current, count, asChild }: SidebarItemProps) {
  const isCurrent = current;
  const { collapsed } = useContext(SidebarContext);
  const link = asChild && isValidElement(children) ? (children as ReactElement<{ className?: string; children?: ReactNode }>) : null;
  const label = link ? link.props.children : children;
  const content = (
    <>
      <span className="rds-sidebar__icon" aria-hidden="true">
        {icon}
      </span>
      <span className={collapsed ? 'rds-visually-hidden' : 'rds-sidebar__label'}>{label}</span>
      {count !== undefined && !collapsed && <span className="rds-sidebar__count">{count}</span>}
    </>
  );
  const common = { 'aria-current': isCurrent ? ('page' as const) : undefined, onClick };
  const entry = link ? (
    cloneElement(link, {
      ...common,
      className: ['rds-sidebar__item', link.props.className].filter(Boolean).join(' '),
      children: content,
    } as Partial<typeof link.props>)
  ) : href ? (
    <a {...common} className="rds-sidebar__item" href={href}>
      {content}
    </a>
  ) : (
    <button {...common} type="button" className="rds-sidebar__item">
      {content}
    </button>
  );
  return (
    <li>
      {collapsed ? (
        <Tooltip text={label} side="right">
          {entry}
        </Tooltip>
      ) : (
        entry
      )}
    </li>
  );
}

export interface SidebarSectionProps {
  /** The group's name ("Atendimento") (Figma: .sidebar/section `label`). */
  label: string;
  /** The group's SidebarItems. */
  children: ReactNode;
  /** The pending items of the group, shown while it is closed (Figma: `showCount` + `count`). */
  count?: number | string;
  /** Open (controlled). */
  open?: boolean;
  /** Open at first (uncontrolled). Default true. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * A group of entries under a label that opens and closes it (Figma: .sidebar/section): a button with
 * aria-expanded. Collapsed, the label leaves the screen but still names the group, and its entries stay visible.
 */
export function SidebarSection({ label, children, count, open: openProp, defaultOpen = true, onOpenChange }: SidebarSectionProps) {
  const { collapsed } = useContext(SidebarContext);
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const id = useId();
  const toggle = () => {
    setOpenState(!open);
    onOpenChange?.(!open);
  };
  if (collapsed) {
    return (
      <li className="rds-sidebar__section">
        <ul className="rds-sidebar__items" aria-label={label}>
          {children}
        </ul>
      </li>
    );
  }
  return (
    <li className="rds-sidebar__section">
      <button type="button" className="rds-sidebar__section-toggle" aria-expanded={open} aria-controls={id} onClick={toggle}>
        <span className="rds-sidebar__section-label">{label}</span>
        {count !== undefined && !open && <span className="rds-sidebar__section-count">{count}</span>}
        <span className="rds-sidebar__chevron" aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </button>
      <ul id={id} className="rds-sidebar__items" hidden={!open}>
        {children}
      </ul>
    </li>
  );
}

/** The line between groups of entries. */
export function SidebarSeparator() {
  return (
    <li className="rds-sidebar__separator" aria-hidden="true">
      <Separator />
    </li>
  );
}
