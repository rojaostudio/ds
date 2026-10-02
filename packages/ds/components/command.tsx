'use client';

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { SearchIcon } from './internal/icons';
import { MenuItemContent, menuItemClassName, type MenuItemContentProps } from './internal/menu';

export interface CommandProps {
  /** The element that opens it (a Button). Ctrl K (⌘ K on a Mac) opens it too, unless `hotkey` is off. */
  trigger?: ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Controlled: what is typed in the search (Figma: `query`). */
  query?: string;
  /** Uncontrolled: what the search starts with. */
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** What the person can search for, shown while the search is empty. */
  placeholder?: string;
  /** The results (Figma: the `results` slot): CommandGroups of CommandItems. They filter by the search. */
  children: ReactNode;
  /** Shown when nothing matches the search. */
  emptyMessage?: string;
  /** Ctrl K (⌘ K) opens and closes it. On by default. */
  hotkey?: boolean;
  /** The window's name for screen readers. */
  label?: string;
  /** Where the layer is portaled (default document.body). */
  container?: HTMLElement | null;
}

interface CommandContextValue {
  query: string;
  activeId: string | null;
  setActiveId: (id: string) => void;
  run: (onSelect?: () => void) => void;
}

const CommandContext = createContext<CommandContextValue | null>(null);

function useCommand(part: string) {
  const ctx = useContext(CommandContext);
  if (!ctx) throw new Error(`${part} must be inside a Command`);
  return ctx;
}

/** Lower case, without accents: "Relatório" is found by "relatorio". */
const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const OPTION = '[role="option"]:not([aria-disabled="true"])';

/**
 * Command — Figma [RDS] Overlays/Command. The command palette: search, then go anywhere or run an action. A modal
 * window (Radix Dialog) with a search field (role="combobox", aria-activedescendant) over a listbox of results in
 * groups. Typing filters (accents and case don't matter, `keywords` count too), the arrows move, Enter runs the
 * highlighted result, Escape closes and gives the focus back. Everything in it also exists on the screen.
 * Styles: internal/menu.css and command.css.
 */
export function Command({
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  query: queryProp,
  defaultQuery = '',
  onQueryChange,
  placeholder = 'Buscar ou ir para…',
  children,
  emptyMessage = 'Nenhum resultado',
  hotkey = true,
  label = 'Comandos',
  container,
}: CommandProps) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  const isOpen = open ?? ownOpen;
  const [ownQuery, setOwnQuery] = useState(defaultQuery);
  const query = queryProp ?? ownQuery;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const setQuery = (next: string) => {
    setOwnQuery(next);
    onQueryChange?.(next);
  };
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
    if (!next) setQuery('');
  };
  // The hotkey listener reads the latest state through a ref, so it is added once.
  const toggle = useRef(() => {});
  toggle.current = () => setOpen(!isOpen);

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        toggle.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkey]);

  const run = (onSelect?: () => void) => {
    setOpen(false);
    onSelect?.();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const options = [...(listRef.current?.querySelectorAll<HTMLElement>(OPTION) ?? [])];
    if (!options.length) return;
    const current = options.findIndex((o) => o.id === activeId);
    let next = -1;
    if (event.key === 'ArrowDown') next = (current + 1) % options.length;
    else if (event.key === 'ArrowUp') next = (current - 1 + options.length) % options.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    else if (event.key === 'Enter') {
      event.preventDefault();
      options[Math.max(current, 0)]?.click();
      return;
    }
    if (next < 0) return;
    event.preventDefault();
    setActiveId(options[next].id);
    options[next].scrollIntoView?.({ block: 'nearest' });
  };

  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay className="rds-command__scrim" />
        <DialogPrimitive.Content className="rds-command" aria-describedby={undefined}>
          <DialogPrimitive.Title className="rds-visually-hidden">{label}</DialogPrimitive.Title>
          <div className="rds-command__search">
            <span className="rds-command__icon" aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              className="rds-command__input"
              type="text"
              role="combobox"
              aria-label={placeholder}
              aria-expanded="true"
              aria-autocomplete="list"
              aria-controls={listId}
              aria-activedescendant={count && activeId ? activeId : undefined}
              autoComplete="off"
              spellCheck={false}
              placeholder={placeholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
            />
            {hotkey && (
              <kbd className="rds-command__hint" aria-hidden="true">
                {mac ? '⌘ K' : 'Ctrl K'}
              </kbd>
            )}
          </div>
          <div ref={listRef} id={listId} role="listbox" aria-label="Resultados" className="rds-command__results">
            <CommandContext.Provider value={{ query: normalize(query.trim()), activeId, setActiveId, run }}>
              {children}
            </CommandContext.Provider>
          </div>
          <Sync
            sync={() => {
              // Count what matched, and keep the highlight on a result that is still there.
              const options = [...(listRef.current?.querySelectorAll<HTMLElement>(OPTION) ?? [])];
              if (options.length !== count) setCount(options.length);
              if (!options.some((o) => o.id === activeId)) setActiveId(options[0]?.id ?? null);
            }}
          />
          {count === 0 && <p className="rds-command__empty">{emptyMessage}</p>}
          <span className="rds-visually-hidden" aria-live="polite">
            {query ? (count ? `${count} ${count === 1 ? 'resultado' : 'resultados'}` : emptyMessage) : ''}
          </span>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * Runs `sync` after every render of the palette's content, once the results are in the DOM. It lives inside the
 * portal: the portal mounts a render after the Command, so an effect in the Command would miss the first results.
 */
function Sync({ sync }: { sync: () => void }) {
  useLayoutEffect(sync);
  return null;
}

export interface CommandGroupProps {
  /** The group's visible name ("Ir para", "Ações"). */
  label: string;
  /** The CommandItems. The group hides when none matches. */
  children: ReactNode;
}

/** A group of results under a name (Figma: the `group` and its `group-label`). */
export function CommandGroup({ label, children }: CommandGroupProps) {
  return (
    <div role="group" aria-label={label} className="rds-command__group">
      <p className="rds-command__group-label" aria-hidden="true">
        {label}
      </p>
      {children}
    </div>
  );
}

export interface CommandItemProps extends MenuItemContentProps {
  /** Runs when chosen (Enter or a click); the palette closes first. */
  onSelect?: () => void;
  /** The text the search matches. Defaults to the label when it is plain text. */
  value?: string;
  /** Other words that find it ("envio" finds "Novo disparo"). */
  keywords?: string[];
  /** Shown but can't be chosen; the arrows skip it. */
  disabled?: boolean;
}

/** One result (Figma .menu/item): role="option". It shows only while it matches the search. */
export function CommandItem({ children, icon, shortcut, onSelect, value, keywords = [], disabled }: CommandItemProps) {
  const { query, activeId, setActiveId, run } = useCommand('CommandItem');
  const id = useId();
  const text = value ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : '');
  if (query && !normalize([text, ...keywords].join(' ')).includes(query)) return null;
  const active = id === activeId;
  return (
    <div
      id={id}
      role="option"
      aria-selected={active}
      aria-disabled={disabled || undefined}
      data-active={active ? '' : undefined}
      className={menuItemClassName()}
      onPointerMove={disabled ? undefined : () => setActiveId(id)}
      onClick={disabled ? undefined : () => run(onSelect)}
    >
      <MenuItemContent icon={icon} shortcut={shortcut}>
        {children}
      </MenuItemContent>
    </div>
  );
}
