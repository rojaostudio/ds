'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Loader2 } from 'lucide-react';

// ── Config type ───────────────────────────────────────────────────────────────

export type SavingBarRegistration = {
  /** Internal id assigned by usePageSavingBar — do not set manually. */
  id?: string;
  visible: boolean;
  message?: string;
  onSave?: () => void | Promise<void>;
  onDiscard?: () => void;
  pending?: boolean;
  saveLabel?: string;
  discardLabel?: string;
  /** Optional third button shown between Discard and Save. Hidden when bars are aggregated. */
  secondary?: { label: string; onClick: () => void };
};

// ── Context ───────────────────────────────────────────────────────────────────

type Registry = Map<string, SavingBarRegistration>;

type SavingBarContextValue = {
  bars: Registry;
  register: (id: string, reg: SavingBarRegistration) => void;
  unregister: (id: string) => void;
};

const SavingBarContext = createContext<SavingBarContextValue>({
  bars: new Map(),
  register: () => {},
  unregister: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function SavingBarProvider({ children }: { children: ReactNode }) {
  const [bars, setBars] = useState<Registry>(() => new Map());

  const register = useCallback((id: string, reg: SavingBarRegistration) => {
    setBars((prev) => {
      const next = new Map(prev);
      next.set(id, { ...reg, id });
      return next;
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setBars((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ bars, register, unregister }), [bars, register, unregister]);

  return <SavingBarContext.Provider value={value}>{children}</SavingBarContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Register a saving bar for the current page/section.
 * The DS renders a single floating bar that aggregates all registrations:
 *   - 0 visible → hidden
 *   - 1 visible → shown directly (message + Salvar + Descartar)
 *   - 2+ visible → "{N} alterações pendentes" + "Salvar tudo" + "Descartar tudo"
 *
 * Pass null to clear. Cleanup on unmount is automatic.
 */
export function usePageSavingBar(
  reg: SavingBarRegistration | null,
  deps: unknown[] = [],
) {
  const id = useId();
  const { register, unregister } = useContext(SavingBarContext);
  const regRef = useRef(reg);
  regRef.current = reg;

  useEffect(() => {
    if (regRef.current) register(id, regRef.current);
    else unregister(id);
    return () => unregister(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, register, unregister, ...deps]);
}

/**
 * #485 — true quando existe QUALQUER saving-bar visível. O FAB (mesmo canto inferior
 * direito) usa isto pra se esconder e não ser tapado pela barra.
 */
export function useSavingBarActive(): boolean {
  const { bars } = useContext(SavingBarContext);
  for (const b of bars.values()) if (b.visible) return true;
  return false;
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function SavingBarRoot() {
  const { bars } = useContext(SavingBarContext);
  const [aggPending, setAggPending] = useState(false);
  const visible = useMemo(
    () => [...bars.values()].filter((b) => b.visible),
    [bars],
  );

  if (visible.length === 0) return null;

  const single = visible.length === 1 ? visible[0] : null;
  const anyPending = aggPending || visible.some((b) => b.pending);

  async function saveAll() {
    setAggPending(true);
    try {
      for (const b of visible) {
        if (b.onSave) await b.onSave();
      }
    } finally {
      setAggPending(false);
    }
  }

  function discardAll() {
    for (const b of visible) b.onDiscard?.();
  }

  const message = single?.message ?? null;
  const saveLabel = single?.saveLabel ?? 'Salvar tudo';
  const discardLabel = single?.discardLabel ?? 'Descartar tudo';
  const onSave = single ? single.onSave : saveAll;
  const onDiscard = single ? single.onDiscard : discardAll;
  const secondary = single?.secondary;

  return (
    <div className="fixed bottom-3 right-6 z-50 transition-all duration-300 ease-out">
      <div className="flex items-center gap-3 rounded-(--radius-card) px-4 py-3 [background:var(--saving-bar-bg)] [box-shadow:var(--saving-bar-shadow)]">
        {message && <span className="text-label pr-1 [color:var(--saving-bar-message)]">{message}</span>}
        {onDiscard && (
          <button
            type="button"
            onClick={onDiscard}
            disabled={anyPending}
            className="rounded-(--radius-card) border px-3 py-1.5 text-label font-medium transition-colors disabled:opacity-40 [border-color:var(--saving-bar-discard-border)] [color:var(--saving-bar-discard-text)] hover:[border-color:var(--saving-bar-discard-border-hover)] hover:[color:var(--saving-bar-discard-text-hover)]"
          >
            {discardLabel}
          </button>
        )}
        {secondary && (
          <button
            type="button"
            onClick={secondary.onClick}
            disabled={anyPending}
            className="rounded-(--radius-card) border px-3 py-1.5 text-label font-medium transition-colors disabled:opacity-40 [border-color:var(--saving-bar-discard-border)] [color:var(--saving-bar-discard-text)] hover:[border-color:var(--saving-bar-discard-border-hover)] hover:[color:var(--saving-bar-discard-text-hover)]"
          >
            {secondary.label}
          </button>
        )}
        {onSave && (
          <button
            type="button"
            onClick={() => onSave()}
            disabled={anyPending}
            className="rounded-(--radius-card) px-4 py-1.5 text-label font-medium transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[80px] justify-center [background:var(--saving-bar-save-bg)] [color:var(--saving-bar-save-text)] hover:[background:var(--saving-bar-save-bg-hover)]"
          >
            {anyPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saveLabel}
          </button>
        )}
      </div>
    </div>
  );
}
