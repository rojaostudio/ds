'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { Plus, Loader2 } from 'lucide-react';
import { useSavingBarActive } from './saving-bar-context';

// ── Config type ───────────────────────────────────────────────────────────────

export type FABConfig = {
  label: string;
  href?: string;
  onClick?: () => void;
  /** cta = primary action button | save = saving-bar with primary + secondary */
  variant?: 'cta' | 'save';
  disabled?: boolean;
  loading?: boolean;
  secondary?: {
    label: string;
    onClick: () => void;
  };
};

// ── Context ───────────────────────────────────────────────────────────────────

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

// ── Provider ──────────────────────────────────────────────────────────────────

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

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useFAB() {
  return useContext(FABContext);
}

/**
 * Register the page's primary FAB action.
 * Clears the FAB automatically on unmount.
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

// ── FABRoot ───────────────────────────────────────────────────────────────────

export function FABRoot() {
  const { config, bottomOffset, fabHidden } = useFAB();
  const savingBarActive = useSavingBarActive();

  // #485 — a saving-bar mora no mesmo canto (bottom-right) e tem z maior; ela tampa o FAB.
  // Esconde o FAB cta enquanto há barra visível. A variante 'save' É uma barra, não esconde.
  const hiddenByBar = savingBarActive && config?.variant !== 'save';
  const visible = !!config && !fabHidden && !hiddenByBar;
  const wrapCls = [
    'fixed right-6 z-40 flex items-center gap-2 transition-all duration-200',
    visible
      ? 'opacity-100 translate-y-0 pointer-events-auto'
      : 'opacity-0 translate-y-2 pointer-events-none',
  ].join(' ');
  const bottomStyle = { bottom: `${24 + bottomOffset}px` };

  // Save variant — inline saving bar
  if (config?.variant === 'save') {
    return (
      <div className={wrapCls} style={bottomStyle}>
        <div className="flex items-center gap-3 rounded-(--radius-control) px-4 py-3 [background:var(--fab-save-bg)] [box-shadow:var(--fab-save-shadow)]">
          {config.secondary && (
            <button
              type="button"
              onClick={config.secondary.onClick}
              disabled={config.loading}
              className="rounded-(--radius-control) border px-3 py-1.5 text-label font-medium transition-colors disabled:opacity-40 cursor-pointer [border-color:var(--fab-save-discard-border)] [color:var(--fab-save-discard-text)] hover:[border-color:var(--fab-save-discard-border-hover)] hover:[color:var(--fab-save-discard-text-hover)]"
            >
              {config.secondary.label}
            </button>
          )}
          <button
            type="button"
            onClick={config.onClick}
            disabled={config.disabled || config.loading}
            className="rounded-(--radius-control) px-4 py-1.5 text-label font-medium transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2 [background:var(--fab-save-primary-bg)] [color:var(--fab-save-primary-text)] hover:[background:var(--fab-save-primary-bg-hover)]"
          >
            {config.loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
              : config.label}
          </button>
        </div>
      </div>
    );
  }

  // CTA variant — primary action button
  const btnCls =
    'flex items-center gap-2 h-12 pl-4 pr-5 rounded-(--radius-control) text-label font-semibold shadow-lg transition-colors cursor-pointer ' +
    '[background:var(--fab-cta-bg)] [color:var(--fab-cta-text)] hover:[background:var(--fab-cta-bg-hover)]';

  return (
    <div className={wrapCls} style={bottomStyle}>
      {config?.href ? (
        <Link href={config.href} className={btnCls}>
          <Plus size={16} strokeWidth={2.5} />
          {config?.label}
        </Link>
      ) : (
        <button
          type="button"
          onClick={config?.onClick}
          disabled={config?.disabled}
          className={btnCls + ' disabled:opacity-50'}
        >
          <Plus size={16} strokeWidth={2.5} />
          {config?.label}
        </button>
      )}
    </div>
  );
}
