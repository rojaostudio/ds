'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { blockWhenDisabled } from './internal/button';
import { PlusIcon } from './internal/icons';
import { SavingBar } from './saving-bar';
import { useSavingBarActive } from './saving-bar-context';

// ── FAB ───────────────────────────────────────────────────────────────────────

export interface FABProps extends ComponentPropsWithRef<'button'> {
  /** The action's name, a verb ("Novo pedido") (Figma: `label`). Always shown: it is the accessible name. */
  children: ReactNode;
  /** Icon before the text (Figma: `hasIcon`). Decorative, rendered with aria-hidden. */
  icon?: ReactNode;
  /** Rendered as aria-disabled="true": stays in the tab order and takes focus, but clicks do nothing. */
  disabled?: boolean;
  /**
   * Render the single child element (an `<a>`, a framework `Link`) with the FAB's classes and behaviour
   * instead of a `<button>`. Use it when the action navigates.
   */
  asChild?: boolean;
  /**
   * A number after the label, such as the items in a cart (Figma: `showCount` + `count`): a pill in the text colour at
   * 20%, "99+" above 99. Gone with 0 or undefined. The real number joins the accessible name: "Carrinho, 12".
   */
  count?: number;
  /** What the number counts, said after it in the name: "itens" → "Carrinho, 12 itens". */
  countLabel?: string;
}

/** What the count adds to the name: "12 itens". */
const countName = (count: number, countLabel?: string) => `${count}${countLabel ? ` ${countLabel}` : ''}`;

/**
 * FAB — Figma [RDS] Actions/FAB. The floating button of a screen's main action: a 56 pill in the brand
 * colour, raised. One per screen, never beside a visible button that does the same thing. It does not
 * place itself: FABRoot (below) or the page puts it in the corner. Styles: fab.css.
 */
export function FAB({
  children,
  icon,
  disabled,
  asChild,
  count,
  countLabel,
  type = 'button',
  className,
  onClick,
  ...rest
}: FABProps) {
  const Root = asChild ? Slot : 'button';
  const hasCount = count !== undefined && count > 0;
  // The count joins the name: "Carrinho, 12 itens". A plain-text label becomes aria-label; anything else (a Link via
  // asChild) gets a hidden suffix.
  const said = hasCount ? countName(count, countLabel) : undefined;
  const plain = typeof children === 'string' || typeof children === 'number' ? String(children) : undefined;
  const named = said !== undefined && plain !== undefined ? `${plain}, ${said}` : undefined;
  return (
    <Root
      {...rest}
      type={asChild ? undefined : type}
      aria-label={named ?? rest['aria-label']}
      className={['rds-fab', className].filter(Boolean).join(' ')}
      aria-disabled={disabled || undefined}
      onClick={blockWhenDisabled(disabled, onClick)}
    >
      {icon && (
        <span className="rds-fab__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <Slottable>{children}</Slottable>
      {hasCount && (
        <span className="rds-fab__count" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
      {said !== undefined && named === undefined && <span className="rds-visually-hidden">{`, ${said}`}</span>}
    </Root>
  );
}

// ── Page composition: one FAB per page, registered by the page and drawn by the shell ───────────

export type FABConfig = {
  label: string;
  /** The FAB's icon. Defaults to a plus. */
  icon?: ReactNode;
  /** A number after the label, "99+" above 99; gone with 0 or undefined (see FAB `count`). */
  count?: number;
  /** What the number counts, said after it in the accessible name: "itens" → "Carrinho, 12 itens". */
  countLabel?: string;
  /** Navigates with a plain `<a>`. For client-side routing, render <FAB asChild><Link/></FAB> yourself. */
  href?: string;
  onClick?: () => void;
  /** cta = the FAB | save = a SavingBar (label saves, secondary discards) */
  variant?: 'cta' | 'save';
  disabled?: boolean;
  /** Only for `save`: the bar shows its saving status. */
  loading?: boolean;
  /** Only for `save`: the discard action. */
  secondary?: {
    label: string;
    onClick: () => void;
  };
};

type FABContextValue = {
  config: FABConfig | null;
  setFAB: (config: FABConfig) => void;
  clearFAB: () => void;
  bottomOffset: number;
  setBottomOffset: (n: number) => void;
  fabHidden: boolean;
  setFabHidden: (v: boolean) => void;
};

const FABContext = createContext<FABContextValue>({
  config: null,
  setFAB: () => {},
  clearFAB: () => {},
  bottomOffset: 0,
  setBottomOffset: () => {},
  fabHidden: false,
  setFabHidden: () => {},
});

export function FABProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<FABConfig | null>(null);
  const [bottomOffset, setBottomOffset] = useState(0);
  const [fabHidden, setFabHidden] = useState(false);
  const setFAB = useCallback((cfg: FABConfig) => setConfig(cfg), []);
  const clearFAB = useCallback(() => setConfig(null), []);

  return (
    <FABContext.Provider value={{ config, setFAB, clearFAB, bottomOffset, setBottomOffset, fabHidden, setFabHidden }}>
      {children}
    </FABContext.Provider>
  );
}

export function useFAB() {
  return useContext(FABContext);
}

/**
 * Register the page's primary FAB action. Clears the FAB automatically on unmount.
 * Pass a stable deps array to avoid re-registering on every render.
 */
export function usePageFAB(config: FABConfig | null, deps: unknown[] = []) {
  const { setFAB, clearFAB } = useFAB();
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (configRef.current) {
      setFAB(configRef.current);
    } else {
      clearFAB();
    }
    return () => clearFAB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFAB, clearFAB, ...deps]);
}

export function FABRoot() {
  const { config, bottomOffset, fabHidden } = useFAB();
  const savingBarActive = useSavingBarActive();

  // #485 — the saving bar lives at the same foot and sits above; it would cover the FAB, so the
  // cta hides while a bar is visible. The 'save' variant is a bar itself.
  const hiddenByBar = savingBarActive && config?.variant !== 'save';
  const visible = !!config && !fabHidden && !hiddenByBar;
  const wrapCls = [
    'rds-fab-root',
    config?.variant === 'save' ? 'rds-fab-root--bar' : 'rds-fab-root--fab',
    !visible && 'rds-fab-root--hidden',
  ]
    .filter(Boolean)
    .join(' ');
  const bottomStyle = { bottom: `${(config?.variant === 'save' ? 0 : 24) + bottomOffset}px` };

  if (!config) return null;

  if (config.variant === 'save') {
    return (
      <div className={wrapCls} style={bottomStyle}>
        <SavingBar
          status={config.loading ? 'saving' : 'unsaved'}
          saveLabel={config.label}
          onSave={() => config.onClick?.()}
          onDiscard={config.secondary?.onClick}
          discardLabel={config.secondary?.label}
        />
      </div>
    );
  }

  const icon = config.icon ?? <PlusIcon />;
  return (
    <div className={wrapCls} style={bottomStyle}>
      {config.href ? (
        <FAB asChild icon={icon} disabled={config.disabled} count={config.count} countLabel={config.countLabel}>
          <a href={config.href}>{config.label}</a>
        </FAB>
      ) : (
        <FAB
          icon={icon}
          disabled={config.disabled}
          count={config.count}
          countLabel={config.countLabel}
          onClick={config.onClick}
        >
          {config.label}
        </FAB>
      )}
    </div>
  );
}
