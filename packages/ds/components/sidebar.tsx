'use client';

import {
  Children,
  cloneElement,
  createContext,
  Fragment,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Avatar } from './avatar';
import { IconButton } from './icon-button';
import { ChevronDownIcon, MenuIcon } from './internal/icons';
import { Status, type StatusTone } from './status';
import { Tooltip } from './tooltip';

export type SidebarHeader = 'mark' | 'logo';
/** What a count is (Figma .sidebar/count `tone`): neutral for a queue, danger for what is overdue. */
export type SidebarCountTone = 'neutral' | 'danger';
/**
 * A state on the right of an entry (Figma .sidebar/item `showStatus`): the Caixa "aberto" or "fechado". The tones
 * are the Status's.
 */
export interface SidebarItemStatus {
  tone: StatusTone;
  /** The state in one word ("aberto"): shown open, said in the entry's name ("Caixa, aberto") in both widths. */
  label: string;
}

/** Below lg (1024) the Sidebar is a drawer (Figma viewport: layout/nav-button/visible). */
const DRAWER_QUERY = '(max-width: 1023px)';

function useDrawerViewport(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
      const query = window.matchMedia(DRAWER_QUERY);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(DRAWER_QUERY).matches,
    () => false,
  );
}

interface SidebarState {
  collapsed: boolean;
  /** The drawer of the phone (below 1024): the entries close it when they navigate. */
  drawer: boolean;
  closeDrawer: () => void;
  /** The one current href (the longest that matches wins) and the hrefs the Sidebar found among its entries. */
  currentHref: string | undefined;
  known: ReadonlySet<string>;
  /** The group with the current route inside it. */
  currentGroup: string | undefined;
  /** The open group of the accordion (one at a time). */
  openGroup: string | undefined;
  setOpenGroup: (key: string | undefined) => void;
  /** The group whose flyout is open in the rail. */
  flyout: string | undefined;
  setFlyout: (key: string | undefined) => void;
}

const SidebarContext = createContext<SidebarState>({
  collapsed: false,
  drawer: false,
  closeDrawer: () => {},
  currentHref: undefined,
  known: new Set(),
  currentGroup: undefined,
  openGroup: undefined,
  setOpenGroup: () => {},
  flyout: undefined,
  setFlyout: () => {},
});

/** 1: a loose entry or a group's header; 2: an entry inside a group. Set by position, never by having children. */
const Level = createContext<1 | 2>(1);

export interface SidebarProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /**
   * mark (default): the brand's square mark and the module's name. logo: the product's official logo, given in
   * `logo`. The DS carries no client logo: both come in through slots.
   */
  header?: SidebarHeader;
  /**
   * The product's logo, for header="logo" (Figma: the `logo` slot). Give it its accessible name (an <img alt>, an svg
   * title). It keeps its own proportion: up to 48 tall in a 64 header, as wide as that makes it up to the header's
   * width (a very wide logo is bounded by the width and comes out shorter).
   */
  logo?: ReactNode;
  /** The brand mark, for header="mark". By default a brand Avatar with the module's first letter. */
  mark?: ReactNode;
  /** The module's name beside the mark (Figma: `module`). Collapsed, it stays for screen readers. */
  module?: string;
  /** Who is signed in, at the foot (Figma: `user`). Collapsed, it stays for screen readers. */
  user?: ReactNode;
  /**
   * The rail (Figma: `collapsed`): 64 wide, the loose entries and one icon per group, each group's entries in a
   * flyout. Each entry keeps its name and shows it in a Tooltip. Below 1024 the Sidebar is the drawer and opens whole.
   */
  collapsed?: boolean;
  /**
   * The current route (a pathname, "/financeiro/contas"). The entry whose `href` is the longest that matches it (the
   * same path, or a path under it) is the current page: one aria-current only, and its group opens. An entry's own
   * `current` also counts, and the longest href still wins.
   */
  currentPath?: string;
  /**
   * The entries (Figma: the `items` slot): SidebarItem (level 1) and SidebarGroup, whose SidebarItems are level 2.
   * Put them directly inside (Fragments are fine): the Sidebar reads their `href` to find the current page.
   */
  children: ReactNode;
  /** The foot, under the user: usually the "Sair" SidebarItem. */
  footer?: ReactNode;
  /**
   * Below 1024, the drawer is open. Controlled with `onDrawerOpenChange`; the button that opens it is the
   * SidebarTrigger (give the Sidebar an `id` and the trigger `controls={id}`). Closed, the drawer is `inert`.
   */
  drawerOpen?: boolean;
  /** Called when the drawer asks to close: Esc, a click on the veil, or an entry that navigates. */
  onDrawerOpenChange?: (open: boolean) => void;
}

type Found = { href?: string; current?: boolean; group?: string };

/** The entries' hrefs and groups, read from the elements (SSR-safe: no effect, no registration). */
function collect(children: ReactNode, group: string | undefined, out: Found[]) {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as Record<string, unknown> & { children?: ReactNode };
    if (child.type === Fragment) return collect(props.children, group, out);
    if (child.type === SidebarGroup) return collect(props.children, groupKey(props as unknown as SidebarGroupProps), out);
    if (child.type === SidebarItem) {
      const linkChild = props.asChild && isValidElement(props.children) ? (props.children.props as { href?: string }) : undefined;
      out.push({ href: (props.href as string | undefined) ?? linkChild?.href, current: props.current as boolean | undefined, group });
    }
  });
}

/** `path` is `href` or a page under it. */
function matches(path: string, href: string): boolean {
  if (path === href) return true;
  const base = href.endsWith('/') ? href : `${href}/`;
  return path.startsWith(base) || path.startsWith(`${href}?`) || path.startsWith(`${href}#`);
}

const groupKey = (props: Pick<SidebarGroupProps, 'id' | 'label'>) => props.id ?? props.label;

/**
 * Sidebar — Figma [RDS] Navigation/Sidebar. The product's main navigation, fixed on the left: a <nav> named
 * "Navegação principal" (override with aria-label) with a list. Two levels by position: loose entries and group
 * headers (44, 14/20 medium, icon of 20) and the entries inside a group (40, indented 44, regular). The groups are an
 * exclusive accordion: the one with the current route opens, the open one closes on its own button. One entry only
 * has aria-current="page": the longest `href` that matches `currentPath` (or an entry's `current`). Collapsed, the
 * rail: the loose entries and one icon per group, with a dot in the worst state of its entries and a flyout with them.
 * Below 1024 it is a drawer (`drawerOpen`, SidebarTrigger). The theme is not a prop: the Sidebar follows its
 * container (`.ds-plate` for the brand-coloured bar, `.dark`). Styles: sidebar.css.
 */
export function Sidebar({
  header = 'mark',
  logo,
  mark,
  module,
  user,
  collapsed: collapsedProp = false,
  currentPath,
  children,
  footer,
  drawerOpen = false,
  onDrawerOpenChange,
  className,
  onKeyDown,
  ...rest
}: SidebarProps) {
  const drawer = useDrawerViewport();
  const collapsed = collapsedProp && !drawer;
  const nav = useRef<HTMLElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  const { currentHref, currentGroup, known } = useMemo(() => {
    const found: Found[] = [];
    collect(children, undefined, found);
    collect(footer, undefined, found);
    let winner: Found | undefined;
    for (const f of found) {
      const hit = f.current || (currentPath !== undefined && f.href !== undefined && matches(currentPath, f.href));
      if (hit && (!winner || (f.href?.length ?? 0) > (winner.href?.length ?? 0))) winner = f;
    }
    return {
      currentHref: winner?.href,
      currentGroup: winner?.group,
      known: new Set(found.map((f) => f.href).filter((h): h is string => h !== undefined)),
    };
  }, [children, footer, currentPath]);

  const [openGroup, setOpenGroup] = useState<string | undefined>(currentGroup);
  // A new route opens its group (and closes the others).
  useEffect(() => setOpenGroup(currentGroup), [currentGroup]);
  const [flyout, setFlyout] = useState<string | undefined>(undefined);

  const closeDrawer = useCallback(() => onDrawerOpenChange?.(false), [onDrawerOpenChange]);
  const drawerShown = drawer && drawerOpen;

  // The drawer: the focus goes in on open and back to what opened it on close.
  useEffect(() => {
    const el = nav.current;
    if (!drawerShown || !el) return;
    returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const target =
      el.querySelector<HTMLElement>('[aria-current="page"]') ?? el.querySelector<HTMLElement>('a[href], button:not([disabled])');
    target?.focus();
    return () => {
      const back = returnTo.current;
      returnTo.current = null;
      if (back && (el.contains(document.activeElement) || document.activeElement === document.body)) back.focus();
    };
  }, [drawerShown]);

  const state = useMemo<SidebarState>(
    () => ({ collapsed, drawer, closeDrawer, currentHref, known, currentGroup, openGroup, setOpenGroup, flyout, setFlyout }),
    [collapsed, drawer, closeDrawer, currentHref, known, currentGroup, openGroup, flyout],
  );

  const hideWhenCollapsed = (on: string) => (collapsed ? 'rds-visually-hidden' : on);
  return (
    <SidebarContext.Provider value={state}>
      {drawerShown && <div className="rds-sidebar__scrim" aria-hidden="true" onClick={closeDrawer} />}
      <nav
        aria-label="Navegação principal"
        {...rest}
        ref={nav}
        inert={drawer && !drawerOpen ? true : undefined}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.key === 'Escape' && drawerShown && !event.defaultPrevented) {
            event.preventDefault();
            closeDrawer();
          }
        }}
        className={[
          'rds-sidebar',
          collapsed && 'rds-sidebar--collapsed',
          drawerShown && 'rds-sidebar--drawer-open',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={['rds-sidebar__header', header === 'logo' && 'rds-sidebar__header--logo'].filter(Boolean).join(' ')}>
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

export interface SidebarTriggerProps {
  /** The Sidebar's `id`: the button's aria-controls. */
  controls: string;
  /** The drawer is open: the button's aria-expanded. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The button's accessible name and Tooltip. */
  label?: string;
  className?: string;
}

/**
 * The button that opens the Sidebar's drawer below 1024 (Figma viewport: layout/nav-button/visible): an IconButton
 * neutral ghost with a Tooltip, aria-controls and aria-expanded. Hidden from 1024 up, where the Sidebar is in view.
 */
export function SidebarTrigger({ controls, open, onOpenChange, label = 'Menu', className }: SidebarTriggerProps) {
  return (
    <Tooltip text={label}>
      <IconButton
        icon={<MenuIcon />}
        label={label}
        tone="neutral"
        variant="ghost"
        aria-controls={controls}
        aria-expanded={open}
        className={['rds-sidebar-trigger', className].filter(Boolean).join(' ')}
        onClick={() => onOpenChange(!open)}
      />
    </Tooltip>
  );
}

interface SidebarItemBaseProps {
  /**
   * The entry's name (Figma: `label`). Collapsed, it stays as the accessible name and shows in a Tooltip. With
   * `asChild`, a single link element (an `<a>`, a framework `Link`) whose text is the name.
   */
  children: ReactNode;
  /** The icon (20), on a level 1 entry. A level 2 entry (inside a SidebarGroup) is text only. Decorative. */
  icon?: ReactNode;
  /** A link: where the entry leads. Without `href` nor `asChild`, the entry is a button (Sair). */
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  /**
   * The current page (Figma: `current`). Prefer the Sidebar's `currentPath`; either way only one entry has
   * aria-current="page" (the longest href wins).
   */
  current?: boolean;
  /** Render the single child element (a framework `Link`) as the entry, with the entry's classes and content. */
  asChild?: boolean;
}

interface SidebarItemCountProps {
  /** A number on the right, such as pending items (Figma: `showCount` + .sidebar/count). In the rail, a dot. */
  count?: number | string;
  /** neutral (default) for a queue, danger for what is overdue (Figma: .sidebar/count `tone`). */
  countTone?: SidebarCountTone;
  /** What the number counts, said after it in the accessible name: "vencidos" → "Contas a pagar, 3 vencidos". */
  countLabel?: string;
  status?: never;
}

interface SidebarItemStatusProps {
  /**
   * A state on the right, instead of a count (Figma: `showStatus`, exclusive with `showCount`): open, a Status sm
   * with the label; in the rail, a dot in the icon's corner in the tone's colour. The label joins the name.
   */
  status: SidebarItemStatus;
  count?: never;
  countTone?: never;
  countLabel?: never;
}

export type SidebarItemProps = SidebarItemBaseProps & (SidebarItemCountProps | SidebarItemStatusProps);

const countName = (count: number | string, countLabel?: string) => `${count}${countLabel ? ` ${countLabel}` : ''}`;

/** One entry (Figma: .sidebar/item). Level 1 (loose): 44, icon of 20. Level 2 (inside a group): 40, text only. */
export function SidebarItem({ children, icon, href, onClick, current, count, countTone = 'neutral', countLabel, status, asChild }: SidebarItemProps) {
  const ctx = useContext(SidebarContext);
  const level = useContext(Level);
  const link = asChild && isValidElement(children) ? (children as ReactElement<{ className?: string; href?: string; children?: ReactNode }>) : null;
  const label = link ? link.props.children : children;
  const ownHref = href ?? link?.props.href;
  const isCurrent = ownHref !== undefined && ctx.known.has(ownHref) ? ownHref === ctx.currentHref : !!current && ctx.currentHref === undefined;
  const rail = ctx.collapsed && level === 1;
  const hasStatus = status !== undefined && status.label !== '';
  const hasCount = !hasStatus && count !== undefined && count !== '';
  // A count or a state joins the name: "Contas a pagar, 3 vencidos", "Caixa, aberto" (a plain-text label; otherwise a
  // hidden suffix).
  const said = hasStatus ? status.label : hasCount ? countName(count, countLabel) : undefined;
  const plain = typeof label === 'string' || typeof label === 'number' ? String(label) : undefined;
  const named = said !== undefined && plain !== undefined ? `${plain}, ${said}` : undefined;
  const dot = hasStatus ? status.tone : hasCount ? countTone : undefined;
  const content = (
    <>
      {level === 1 && icon && (
        <span className="rds-sidebar__icon" aria-hidden="true">
          {icon}
          {rail && dot && <span className={`rds-sidebar__dot rds-sidebar__dot--${dot}`} />}
        </span>
      )}
      <span className={rail ? 'rds-visually-hidden' : 'rds-sidebar__label'}>{label}</span>
      {hasCount && !rail && (
        <span className={`rds-sidebar__count rds-sidebar__count--${countTone}`} aria-hidden="true">
          {count}
        </span>
      )}
      {hasStatus && !rail && (
        <Status tone={status.tone} size="sm" className="rds-sidebar__status" aria-hidden="true">
          {status.label}
        </Status>
      )}
      {said !== undefined && named === undefined && <span className="rds-visually-hidden">{`, ${said}`}</span>}
    </>
  );
  const className = ['rds-sidebar__item', `rds-sidebar__item--level-${level}`].join(' ');
  const navigate: MouseEventHandler<HTMLElement> = (event) => {
    onClick?.(event);
    // A framework Link cancels the click to navigate on the client: the drawer closes either way.
    if (ctx.drawer) ctx.closeDrawer();
  };
  const common = { 'aria-current': isCurrent ? ('page' as const) : undefined, 'aria-label': named, onClick: navigate };
  const entry = link ? (
    cloneElement(link, {
      ...common,
      className: [className, link.props.className].filter(Boolean).join(' '),
      children: content,
    } as Partial<typeof link.props>)
  ) : href ? (
    <a {...common} className={className} href={href}>
      {content}
    </a>
  ) : (
    <button {...common} type="button" className={className}>
      {content}
    </button>
  );
  return (
    <li>
      {rail ? (
        <Tooltip text={label} side="right">
          {entry}
        </Tooltip>
      ) : (
        entry
      )}
    </li>
  );
}

export interface SidebarGroupProps {
  /** The group's name ("Financeiro") (Figma: .sidebar/section `label`). It never carries a number. */
  label: string;
  /** The group's icon (20), as on a level 1 entry. In the rail it is the group's button. */
  icon: ReactNode;
  /** A stable key for the accordion (by default the label). */
  id?: string;
  /** The group's SidebarItems: level 2, text only. */
  children: ReactNode;
}

/** The worst state among the entries (danger over neutral) and what their counts say, for the rail. */
function groupCounts(children: ReactNode) {
  const found: { count: number | string; tone: SidebarCountTone; label?: string }[] = [];
  const walk = (nodes: ReactNode) =>
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;
      const p = child.props as SidebarItemProps & { children?: ReactNode };
      if (child.type === Fragment) return walk(p.children);
      if (child.type === SidebarItem && p.count !== undefined && p.count !== '')
        found.push({ count: p.count, tone: p.countTone ?? 'neutral', label: p.countLabel });
    });
  walk(children);
  const tone: SidebarCountTone | undefined = found.some((f) => f.tone === 'danger') ? 'danger' : found.length ? 'neutral' : undefined;
  const worst = found.filter((f) => f.tone === tone);
  return { tone, said: worst.map((f) => countName(f.count, f.label)).join(', ') };
}

/**
 * A group of entries (Figma: .sidebar/section): a level 1 header (icon, name, chevron) that opens and closes it, a
 * button with aria-expanded and aria-controls. An exclusive accordion: one group open at a time, the one with the
 * current route; the open one closes on the same button. No count on the header: the numbers are on its entries. In
 * the rail it is one icon with a dot in the worst state of its entries and a flyout with them (the DropdownMenu's
 * shell) that opens on click or on focus without moving the focus; Enter, Space and → go into it, Esc closes it and
 * gives the focus back. The group's accessible name carries the number ("Financeiro, 3 vencidos").
 */
export function SidebarGroup({ label, icon, id, children }: SidebarGroupProps) {
  const ctx = useContext(SidebarContext);
  const key = groupKey({ id, label });
  const listId = useId();
  const isCurrent = ctx.currentGroup === key;
  const open = ctx.openGroup === key;
  const { tone, said } = useMemo(() => groupCounts(children), [children]);

  if (ctx.collapsed) {
    return (
      <RailGroup groupKey={key} label={label} icon={icon} current={isCurrent} tone={tone} said={said} listId={listId}>
        {children}
      </RailGroup>
    );
  }
  return (
    <li className="rds-sidebar__group">
      <button
        type="button"
        className={['rds-sidebar__item', 'rds-sidebar__item--level-1', 'rds-sidebar__group-toggle', isCurrent && 'rds-sidebar__group-toggle--current']
          .filter(Boolean)
          .join(' ')}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => ctx.setOpenGroup(open ? undefined : key)}
      >
        <span className="rds-sidebar__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="rds-sidebar__label">{label}</span>
        <span className="rds-sidebar__chevron" aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </button>
      <ul id={listId} className="rds-sidebar__items" hidden={!open}>
        <Level.Provider value={2}>{children}</Level.Provider>
      </ul>
    </li>
  );
}

interface RailGroupProps {
  groupKey: string;
  label: string;
  icon: ReactNode;
  current: boolean;
  tone: SidebarCountTone | undefined;
  said: string;
  listId: string;
  children: ReactNode;
}

/** The group in the rail: an icon, a dot and the flyout. */
function RailGroup({ groupKey: key, label, icon, current, tone, said, listId, children }: RailGroupProps) {
  const ctx = useContext(SidebarContext);
  const open = ctx.flyout === key;
  const root = useRef<HTMLLIElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const byPointer = useRef(false);
  /** The focus coming back from the flyout (Esc, ←) must not open it again. */
  const returning = useRef(false);
  const setOpen = (next: boolean) => ctx.setFlyout(next ? key : ctx.flyout === key ? undefined : ctx.flyout);
  const links = () => [...(root.current?.querySelectorAll<HTMLElement>('.rds-sidebar__flyout a, .rds-sidebar__flyout button') ?? [])];

  // A click outside closes the flyout.
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) ctx.setFlyout(undefined);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open, ctx]);

  const enter = () => {
    setOpen(true);
    requestAnimationFrame(() => (links().find((l) => l.getAttribute('aria-current') === 'page') ?? links()[0])?.focus());
  };
  const closeAndReturn = () => {
    ctx.setFlyout(undefined);
    returning.current = true;
    button.current?.focus();
    returning.current = false;
  };

  return (
    <li
      ref={root}
      className="rds-sidebar__group rds-sidebar__group--rail"
      onBlur={(event: FocusEvent<HTMLLIElement>) => {
        if (!root.current?.contains(event.relatedTarget as Node)) ctx.setFlyout(undefined);
      }}
    >
      <button
        ref={button}
        type="button"
        className={['rds-sidebar__item', 'rds-sidebar__item--level-1', 'rds-sidebar__group-toggle', current && 'rds-sidebar__group-toggle--current']
          .filter(Boolean)
          .join(' ')}
        aria-label={said ? `${label}, ${said}` : label}
        aria-expanded={open}
        aria-controls={listId}
        onPointerDown={() => (byPointer.current = true)}
        onFocus={() => {
          if (!byPointer.current && !returning.current) setOpen(true);
        }}
        onClick={() => {
          byPointer.current = false;
          setOpen(!open);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
          if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowRight') {
            event.preventDefault();
            enter();
          } else if (event.key === 'Escape' && open) {
            event.preventDefault();
            event.stopPropagation();
            ctx.setFlyout(undefined);
          }
        }}
      >
        <span className="rds-sidebar__icon" aria-hidden="true">
          {icon}
          {tone && <span className={`rds-sidebar__dot rds-sidebar__dot--${tone}`} />}
        </span>
      </button>
      <div
        className="rds-menu rds-sidebar__flyout"
        hidden={!open}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('a, button')) ctx.setFlyout(undefined);
        }}
        onKeyDown={(event) => {
          const list = links();
          const i = list.indexOf(document.activeElement as HTMLElement);
          if (event.key === 'Escape' || event.key === 'ArrowLeft') {
            event.preventDefault();
            event.stopPropagation();
            closeAndReturn();
          } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            list[(i + 1) % list.length]?.focus();
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            list[(i - 1 + list.length) % list.length]?.focus();
          }
        }}
      >
        <p className="rds-sidebar__flyout-title" aria-hidden="true">
          {label}
        </p>
        <ul id={listId} className="rds-sidebar__items" aria-label={label}>
          <Level.Provider value={2}>{children}</Level.Provider>
        </ul>
      </div>
    </li>
  );
}
