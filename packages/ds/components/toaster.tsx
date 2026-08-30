'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X, Check, AlertTriangle, Info } from 'lucide-react';

/**
 * Toaster — comportamento de snackbar M3, visual de notification card.
 *
 * Comportamento (M3):
 *   • Um por vez (novo substitui o anterior).
 *   • Action label OU close icon — não os dois.
 *   • Duração: 4s sem action, 7s com action; persistente em loading.
 *   • Posição default: bottom-center.
 *   • Motion: 150ms ease-out enter, 75ms ease-in exit, slide vertical + fade.
 *   • Não rouba foco. aria-live="polite" default, "assertive" pra erro.
 *
 * Visual (notification card):
 *   • Card escuro nos DOIS themes (inverse surface, tokens --toast-*).
 *   • Feedback variants: tint da cor semântica entra pela esquerda (gradiente)
 *     + badge circular sólido com halo — ícone em tom escuro da própria cor.
 *   • Título (message) + description opcional em --toast-text-muted.
 *   • default/loading: card neutro sem tint nem badge.
 *
 * API:
 *   import { toast } from '@rojaostudio/ds/components';
 *   toast('Salvo');
 *   toast.success('Salvo', { description: 'Pedido #1042 confirmado.' });
 *   toast.error('...'), toast.warning('...'), toast.info('...'), toast.loading('...');
 *   toast.dismiss(id?);
 *   toast.promise(p, { loading, success, error });
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right'
                          | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastOptions {
  variant?:     ToastVariant;
  /** Linha secundária — message vira título (semibold) quando presente. */
  description?: string;
  /** ms até auto-dismiss. Omitido → fallback do Material (1500 curto · 2750 com ação/erro · 0 loading). */
  duration?:    number;
  action?:      { label: string; onClick: () => void };
  id?:          string;
}

interface ToastItem {
  id:           string;
  message:      string;
  description?: string;
  variant:      ToastVariant;
  duration:     number;
  action?:      ToastOptions['action'];
  exiting?:     boolean;
}

// ── Singleton emitter ────────────────────────────────────────────────────────

type Listener = (action:
  | { type: 'show'; toast: ToastItem }
  | { type: 'update'; id: string; patch: Partial<ToastItem> }
  | { type: 'dismiss'; id: string }
) => void;

const listeners = new Set<Listener>();
function emit(a: Parameters<Listener>[0]) { for (const l of listeners) l(a); }

let counter = 0;
function genId() { counter += 1; return `t${Date.now()}_${counter}`; }

// FALLBACK de duração — só vale quando o toast não passa `duration` nas opções.
// Segue o Material Design (Snackbar): LENGTH_SHORT = 1500ms (confirmações curtas),
// LENGTH_LONG = 2750ms (quando há ação — tempo de ler + clicar — ou em erros, cuja
// mensagem precisa ser lida). Pra ajuste fino, cada toast pode sobrescrever com
// `toast.x(msg, { duration })` sem republicar o DS.
function defaultDuration(variant: ToastVariant, hasAction: boolean): number {
  if (variant === 'loading') return 0;
  if (hasAction || variant === 'error') return 2750; // LENGTH_LONG
  return 1500;                                        // LENGTH_SHORT
}

function show(message: string, options: ToastOptions = {}): string {
  const id = options.id ?? genId();
  const variant = options.variant ?? 'default';
  const hasAction = !!options.action;
  emit({
    type: 'show',
    toast: {
      id,
      message,
      description: options.description,
      variant,
      duration: options.duration ?? defaultDuration(variant, hasAction),
      action:   options.action,
    },
  });
  return id;
}

// ── Public API ───────────────────────────────────────────────────────────────

interface ToastFn {
  (message: string, options?: ToastOptions): string;
  success: (msg: string, opts?: Omit<ToastOptions, 'variant'>) => string;
  error:   (msg: string, opts?: Omit<ToastOptions, 'variant'>) => string;
  warning: (msg: string, opts?: Omit<ToastOptions, 'variant'>) => string;
  info:    (msg: string, opts?: Omit<ToastOptions, 'variant'>) => string;
  loading: (msg: string, opts?: Omit<ToastOptions, 'variant' | 'duration'>) => string;
  dismiss: (id?: string) => void;
  promise: <T>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error:   string | ((err: unknown) => string);
    },
  ) => Promise<T>;
}

const base = (msg: string, opts?: ToastOptions) => show(msg, opts);

export const toast: ToastFn = Object.assign(base, {
  success: (m: string, o?: Omit<ToastOptions, 'variant'>) => show(m, { ...o, variant: 'success' }),
  error:   (m: string, o?: Omit<ToastOptions, 'variant'>) => show(m, { ...o, variant: 'error' }),
  warning: (m: string, o?: Omit<ToastOptions, 'variant'>) => show(m, { ...o, variant: 'warning' }),
  info:    (m: string, o?: Omit<ToastOptions, 'variant'>) => show(m, { ...o, variant: 'info' }),
  loading: (m: string, o?: Omit<ToastOptions, 'variant' | 'duration'>) =>
    show(m, { ...o, variant: 'loading' }),
  dismiss: (id?: string) => {
    if (id) emit({ type: 'dismiss', id });
    else listeners.forEach(l => l({ type: 'dismiss', id: '*' }));
  },
  promise: async <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error:   string | ((err: unknown) => string);
    },
  ): Promise<T> => {
    const id = show(msgs.loading, { variant: 'loading' });
    try {
      const data = await promise;
      const m = typeof msgs.success === 'function' ? msgs.success(data) : msgs.success;
      emit({ type: 'update', id, patch: { variant: 'success', message: m, duration: defaultDuration('success', false) } });
      return data;
    } catch (err) {
      const m = typeof msgs.error === 'function' ? msgs.error(err) : msgs.error;
      emit({ type: 'update', id, patch: { variant: 'error', message: m, duration: defaultDuration('error', false) } });
      throw err;
    }
  },
});

// ── ToastVisual — renderização pura (sem portal/state) ──────────────────────
// Usado pelo Toaster (com portal/state) e pelo playground (preview estático).

export interface ToastVisualProps {
  message:      string;
  /** Linha secundária — message vira título (semibold) quando presente. */
  description?: string;
  variant?:     ToastVariant;
  action?:      { label: string; onClick?: () => void };
  /** Quando true, renderiza a animação de entrada. default = false. */
  animate?:     boolean;
  /** Top vs bottom afeta a direção da animação enter. default = 'bottom'. */
  origin?:      'top' | 'bottom';
  /** Mostra o botão de close (X). default = true se não houver action; M3
   *  prescreve action OU close, não ambos. */
  dismissible?: boolean;
  /** Handler do close (opcional). Sem handler, o X aparece mas é decorativo. */
  onDismiss?:   () => void;
}

// Cor semântica por variant — alimenta o tint lateral e o badge.
// default/loading não têm cor (card neutro).
const VARIANT_COLOR: Partial<Record<ToastVariant, string>> = {
  success: 'var(--success)',
  error:   'var(--danger)',
  warning: 'var(--warning)',
  info:    'var(--info)',
};

// Card escuro nos dois themes (--toast-bg). Feedback variants ganham um tint
// da cor semântica entrando pela esquerda e morrendo no meio do card — os
// sólidos --success/--danger/etc. não mudam entre themes, então o gradiente
// funciona igual em light e dark.
function containerStyle(variant: ToastVariant): React.CSSProperties {
  const c = VARIANT_COLOR[variant];
  return {
    background: c
      ? `linear-gradient(105deg, color-mix(in srgb, ${c} 16%, var(--toast-bg)) 0%, var(--toast-bg) 60%)`
      : 'var(--toast-bg)',
    color: 'var(--toast-text)',
  };
}

// Ícone leading por variant. Glifos "crus" (sem círculo do próprio ícone) —
// o círculo é o badge. Default não tem ícone.
const VARIANT_ICON: Record<ToastVariant, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; style?: React.CSSProperties }> | null> = {
  default: null,
  success: Check,
  error:   X,
  warning: AlertTriangle,
  info:    Info,
  loading: Loader2,
};

export function ToastVisual({
  message,
  description,
  variant = 'default',
  action,
  animate = false,
  origin  = 'bottom',
  dismissible,
  onDismiss,
}: ToastVisualProps) {
  const isError = variant === 'error';
  const isLoading = variant === 'loading';
  const hasAction = !!action;
  // Default: dismissible quando não tem action e não é loading.
  const showClose = dismissible ?? (!hasAction && !isLoading);

  const animClass = animate
    ? (origin === 'top' ? 'rojao-toast--enter-top' : 'rojao-toast--enter-bottom')
    : '';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={[
        'rojao-toast',
        'flex items-center gap-3 px-4 py-3 shadow-lg',
        'min-w-[344px] max-w-[min(560px,calc(100vw-2rem))]',
        animClass,
      ].join(' ')}
      style={{
        ...containerStyle(variant),
        border:       '1px solid var(--toast-border)',
        borderRadius: 'var(--radius-toast)',
        minHeight:    '56px',
        fontFamily:   'var(--font-family)',
      }}
    >
      {(() => {
        const Icon = VARIANT_ICON[variant];
        if (!Icon) return null;
        if (isLoading) {
          return (
            <Icon
              size={18}
              className="shrink-0 animate-spin"
              style={{ color: 'var(--toast-text-muted)' }}
            />
          );
        }
        const c = VARIANT_COLOR[variant]!;
        // Badge circular sólido + halo (brilho). Ícone num tom escuro da
        // própria cor — os sólidos são iguais em light/dark, o mix também.
        return (
          <span
            aria-hidden="true"
            className="grid place-items-center rounded-full shrink-0 size-9"
            style={{
              background: c,
              color:      `color-mix(in srgb, ${c} 30%, black)`,
              boxShadow:  `0 0 0 5px color-mix(in srgb, ${c} 18%, transparent)`,
            }}
          >
            <Icon size={18} strokeWidth={2.75} />
          </span>
        );
      })()}
      <div className="flex-1 min-w-0">
        <p className={description ? 'text-[0.9375rem] font-semibold leading-snug' : 'text-label leading-snug'}>
          {message}
        </p>
        {description && (
          <p className="text-label leading-snug mt-0.5" style={{ color: 'var(--toast-text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      {hasAction ? (
        <button
          type="button"
          onClick={action!.onClick}
          className="shrink-0 text-label font-medium px-2 -mr-1 transition-opacity hover:opacity-80"
          style={{ color: 'currentColor' }}
        >
          {action!.label}
        </button>
      ) : showClose && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar"
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: 'currentColor' }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ── Toaster — provider (portal + state + auto-dismiss) ──────────────────────

export interface ToasterProps {
  /** Posição. default = bottom-center (M3 recomenda bottom). */
  position?: ToastPosition;
}

const POSITION_CLASS: Record<ToastPosition, string> = {
  'top-left':      'top-4 left-4',
  'top-center':    'top-4 left-1/2 -translate-x-1/2',
  'top-right':     'top-4 right-4',
  'bottom-left':   'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right':  'bottom-4 right-4',
};

export function Toaster({ position = 'bottom-center' }: ToasterProps = {}) {
  // M3: um snackbar por vez. Estado é o toast atual (ou null).
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const startExit = useCallback((id: string) => {
    clearTimer();
    setCurrent(prev => prev && prev.id === id ? { ...prev, exiting: true } : prev);
    setTimeout(() => {
      setCurrent(prev => prev && prev.id === id ? null : prev);
    }, 75); // M3 exit
  }, [clearTimer]);

  const scheduleDismiss = useCallback((t: ToastItem) => {
    if (t.duration <= 0) return;
    timerRef.current = setTimeout(() => startExit(t.id), t.duration);
  }, [startExit]);

  // Ref keeps dismiss handler up-to-date without adding current?.id to effect deps
  const currentRef = useRef<ToastItem | null>(null);
  currentRef.current = current;

  useEffect(() => {
    const listener: Listener = action => {
      if (action.type === 'show') {
        // Substitui o atual (M3: 1 por vez)
        clearTimer();
        setCurrent(action.toast);
        scheduleDismiss(action.toast);
      } else if (action.type === 'update') {
        setCurrent(prev => {
          if (!prev || prev.id !== action.id) return prev;
          const next = { ...prev, ...action.patch, exiting: false };
          clearTimer();
          if (next.duration > 0) {
            timerRef.current = setTimeout(() => startExit(next.id), next.duration);
          }
          return next;
        });
      } else if (action.type === 'dismiss') {
        if (action.id === '*') startExit(currentRef.current?.id ?? '');
        else if (currentRef.current?.id === action.id) startExit(action.id);
      }
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      clearTimer();
    };
  }, [clearTimer, scheduleDismiss, startExit]);

  const handleMouseEnter = () => clearTimer();
  const handleMouseLeave = () => { if (current && !current.exiting) scheduleDismiss(current); };

  if (!mounted || !current) return null;

  const t = current;
  const isError = t.variant === 'error';
  const ariaLive = isError ? 'assertive' : 'polite';
  const isTop = position.startsWith('top-');

  // Quando exiting, troca classe pra animação de saída.
  const exitClass = t.exiting
    ? (isTop ? 'rojao-toast--exit-top' : 'rojao-toast--exit-bottom')
    : '';

  return createPortal(
    <div
      aria-live={ariaLive}
      aria-atomic="true"
      className={['fixed z-[9999] pointer-events-none', POSITION_CLASS[position]].join(' ')}
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={['pointer-events-auto', exitClass].join(' ')}
      >
        <ToastVisual
          message={t.message}
          description={t.description}
          variant={t.variant}
          action={t.action ? {
            label:  t.action.label,
            onClick: () => { t.action!.onClick(); startExit(t.id); },
          } : undefined}
          animate={!t.exiting}
          origin={isTop ? 'top' : 'bottom'}
          onDismiss={() => startExit(t.id)}
        />
      </div>
    </div>,
    document.body,
  );
}
