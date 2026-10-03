'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { Button } from './button';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';
import { AlertIcon, CircleCheckIcon, CloseIcon, InfoIcon, TriangleAlertIcon } from './internal/icons';

export type ToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
/** Figma calls this property `style`: outline (white with a border, the default), soft (light plate), fill (full plate). */
export type ToastVariant = 'outline' | 'soft' | 'fill';

export interface ToastOptions {
  /** What happened, in a few words (Figma: `title`). */
  title: ReactNode;
  /** The detail (Figma: `showDescription` + `description`). */
  description?: ReactNode;
  /** neutral for a plain confirmation. danger is announced at once (assertive); the others politely. */
  tone?: ToastTone;
  variant?: ToastVariant;
  /** The tone's icon (Figma: `showIcon`). Decorative. */
  showIcon?: boolean;
  /**
   * One action (Figma: `showAction`): "Desfazer", "Ver". A toast with an action does not close by itself (WCAG 2.2.1,
   * Timing Adjustable): it stays until the person uses the action or the ×. Choosing the action also closes it.
   */
  action?: { label: string; onClick: () => void };
  /**
   * ms on screen. Default 5 s; `Infinity` (until closed) with an action. It pauses while the mouse or the focus is on
   * it. A number given here wins, also with an action: give one only when the action can be reached some other way.
   */
  duration?: number;
  /** Give the same id to replace a toast that is on screen instead of stacking another one. */
  id?: string;
}

const ICONS: Record<ToastTone, () => ReactNode> = {
  neutral: InfoIcon,
  info: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  danger: AlertIcon,
};

export const toastClassName = (tone: ToastTone = 'neutral', variant: ToastVariant = 'outline', extra?: string) =>
  ['rds-toast', `rds-toast--${tone}-${variant}`, variant !== 'outline' && 'rds-toast--plate', extra]
    .filter(Boolean)
    .join(' ');

export interface ToastViewProps extends Omit<ToastOptions, 'duration' | 'id'> {
  /** Called by the ×. */
  onClose?: () => void;
  /** The ×'s accessible name. */
  closeLabel?: string;
  className?: string;
}

/**
 * ToastView — the toast's drawing alone, outside the Toaster: for documentation and static previews. In the app,
 * show toasts with `toast()` (or `useToast()`) and mount one `<Toaster />`.
 */
export function ToastView({
  title,
  description,
  tone = 'neutral',
  variant = 'outline',
  showIcon = true,
  action,
  onClose,
  closeLabel = 'Fechar',
  className,
}: ToastViewProps) {
  return (
    <div className={toastClassName(tone, variant, className)}>
      <ToastBody tone={tone} showIcon={showIcon} title={<p className="rds-toast__title">{title}</p>}>
        {description && <p className="rds-toast__description">{description}</p>}
      </ToastBody>
      {action && (
        <Button tone="neutral" variant="ghost" className="rds-toast__action" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      <Tooltip text={closeLabel}>
        <IconButton icon={<CloseIcon />} label={closeLabel} tone="neutral" variant="ghost" className="rds-toast__close" onClick={onClose} />
      </Tooltip>
    </div>
  );
}

function ToastBody({ tone, showIcon, title, children }: { tone: ToastTone; showIcon: boolean; title: ReactNode; children?: ReactNode }) {
  const Icon = ICONS[tone];
  return (
    <>
      {showIcon && (
        <span className="rds-toast__icon" aria-hidden="true">
          <Icon />
        </span>
      )}
      <div className="rds-toast__content">
        {title}
        {children}
      </div>
    </>
  );
}

// ── The imperative API: toast() works from anywhere, the mounted Toaster draws ─────────────────────────────

interface Item extends ToastOptions {
  key: string;
  open: boolean;
}

type Event = { type: 'show'; item: Item } | { type: 'dismiss'; id?: string };
const listeners = new Set<(event: Event) => void>();
let counter = 0;

export interface ToastFn {
  /** Shows a toast and returns its id. Needs one `<Toaster />` mounted on the page. */
  (options: ToastOptions): string;
  /** Closes the toast with that id, or every toast. */
  dismiss: (id?: string) => void;
}

/** Shows a toast from anywhere (an event handler, a mutation's onSuccess). One `<Toaster />` must be mounted. */
export const toast: ToastFn = Object.assign(
  (options: ToastOptions) => {
    counter += 1;
    const key = options.id ?? `rds-toast-${counter}`;
    if (!listeners.size && process.env.NODE_ENV !== 'production') {
      console.warn('[@rojaostudio/ds] toast(): no <Toaster /> is mounted, so the toast is not shown.');
    }
    listeners.forEach((listener) => listener({ type: 'show', item: { ...options, key, open: true } }));
    return key;
  },
  {
    dismiss: (id?: string) => listeners.forEach((listener) => listener({ type: 'dismiss', id })),
  },
);

/** The same `toast` function, as a hook, for components that prefer to receive it. */
export function useToast(): ToastFn {
  return toast;
}

const MAX_VISIBLE = 3;

export interface ToasterProps {
  /** The region's name, said with the F8 shortcut that takes the focus to it. */
  label?: string;
  /** The ×'s accessible name (and its Tooltip), on every toast. Default "Fechar". */
  closeLabel?: string;
  /** The app, when the Toaster wraps it. It can also be mounted alone, once, anywhere on the page. */
  children?: ReactNode;
}

/** @internal How long a toast stays: 5 s, or until closed when it has an action (WCAG 2.2.1). */
export const toastDuration = (duration: number | undefined, hasAction: boolean): number =>
  duration ?? (hasAction ? Infinity : 5000);

/**
 * Toaster — the region where the toasts of the Figma [RDS] Feedback/Toast appear (Radix Toast): the bottom-right
 * corner, up to three at a time (a fourth pushes the oldest out), each one announced in a live region (danger
 * assertively, the others politely). F8 takes the focus to the region; swiping right dismisses. A toast closes by
 * itself after 5 s; one with an action stays until the action or the × (WCAG 2.2.1). Styles: toast.css.
 */
export function Toaster({ label = 'Notificações', closeLabel = 'Fechar', children }: ToasterProps) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const listener = (event: Event) => {
      if (event.type === 'show') {
        setItems((current) => {
          const rest = current.filter((item) => item.key !== event.item.key);
          const open = rest.filter((item) => item.open);
          const drop = open.length >= MAX_VISIBLE ? open[0].key : null;
          return [...rest.map((item) => (item.key === drop ? { ...item, open: false } : item)), event.item];
        });
      } else {
        setItems((current) =>
          current.map((item) => (event.id === undefined || item.key === event.id ? { ...item, open: false } : item)),
        );
      }
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const close = useCallback((key: string) => {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, open: false } : item)));
    // After the exit, forget it.
    window.setTimeout(() => setItems((current) => current.filter((item) => item.key !== key || item.open)), 300);
  }, []);

  return (
    <ToastPrimitive.Provider label={label} swipeDirection="right">
      {children}
      {items.map(({ key, open, title, description, tone = 'neutral', variant = 'outline', showIcon = true, action, duration }) => (
        <ToastPrimitive.Root
          key={key}
          open={open}
          onOpenChange={(next) => {
            if (!next) close(key);
          }}
          type={tone === 'danger' ? 'foreground' : 'background'}
          duration={toastDuration(duration, Boolean(action))}
          className={toastClassName(tone, variant)}
        >
          <ToastBody
            tone={tone}
            showIcon={showIcon}
            title={<ToastPrimitive.Title className="rds-toast__title">{title}</ToastPrimitive.Title>}
          >
            {description && (
              <ToastPrimitive.Description className="rds-toast__description">{description}</ToastPrimitive.Description>
            )}
          </ToastBody>
          {action && (
            <ToastPrimitive.Action altText={action.label} asChild>
              <Button tone="neutral" variant="ghost" className="rds-toast__action" onClick={action.onClick}>
                {action.label}
              </Button>
            </ToastPrimitive.Action>
          )}
          <Tooltip text={closeLabel}>
            <ToastPrimitive.Close asChild>
              <IconButton icon={<CloseIcon />} label={closeLabel} tone="neutral" variant="ghost" className="rds-toast__close" />
            </ToastPrimitive.Close>
          </Tooltip>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="rds-toast-viewport" label={`${label} ({hotkey})`} />
    </ToastPrimitive.Provider>
  );
}
