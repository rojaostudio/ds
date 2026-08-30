import { forwardRef } from 'react';

// ── Label variants ─────────────────────────────────────────────────────────────
const LABEL_VARIANTS = {
  default: 'bg-surface-default text-fg-muted border border-stroke-default',
  primary: 'bg-brand-primary text-brand-on-primary',
  success: 'bg-success-soft text-success-text border border-success-border',
  warning: 'bg-warning-soft text-warning-text border border-warning-border',
  danger:  'bg-danger-soft  text-danger-text  border border-danger-border',
  info:    'bg-info-soft    text-info-text    border border-info-border',
  neutral: 'bg-neutral-soft text-neutral-text border border-neutral-border',
} as const;

// ── Status dot colors ──────────────────────────────────────────────────────────
const STATUS_VARIANTS = {
  active:   { dot: 'bg-success', text: 'text-success-text' },
  inactive: { dot: 'bg-state-disabled-text', text: 'text-state-disabled-text' },
  pending:  { dot: 'bg-warning', text: 'text-warning-text' },
  error:    { dot: 'bg-danger',  text: 'text-danger-text'  },
} as const;

export type BadgeVariant =
  | keyof typeof LABEL_VARIANTS
  | keyof typeof STATUS_VARIANTS
  | 'count'
  | 'dot';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  variant?: BadgeVariant;
  size?:    BadgeSize;
  /** Para variant="count": número exibido. Acima de `max` mostra "max+". */
  count?:   number;
  /** Limite pra count overflow. default = 99. */
  max?:     number;
  /** Para variant="dot": cor da bolinha (default = brand-primary). */
  dotColor?: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children?: React.ReactNode;
}

// Radius via token semântico (--radius-badge: full) — o dot interno continua
// rounded-full por ser um círculo estrutural, não decisão de tema.
const BASE = 'inline-flex items-center rounded-(--radius-badge) font-medium transition-colors';
const SIZE_CLASS: Record<BadgeSize, string> = {
  sm: 'text-[10px]',
  md: 'text-caption',
};

const DOT_BG: Record<NonNullable<BadgeProps['dotColor']>, string> = {
  brand:   'bg-brand-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
  info:    'bg-info',
  neutral: 'bg-neutral',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge({
  variant = 'default',
  size = 'md',
  count,
  max = 99,
  dotColor = 'brand',
  className = '',
  children,
  ...props
}: BadgeProps, ref) {
  // Dot puro (notification indicator)
  if (variant === 'dot') {
    return (
      <span
        ref={ref}
        role="status"
        className={[
          'inline-block rounded-full',
          size === 'sm' ? 'size-2' : 'size-2.5',
          DOT_BG[dotColor],
          className,
        ].join(' ')}
        {...props}
      />
    );
  }

  // Count badge (numérico, com overflow)
  if (variant === 'count') {
    const display = count !== undefined
      ? (count > max ? `${max}+` : String(count))
      : children;
    if (count !== undefined && count <= 0) return null;
    return (
      <span
        ref={ref}
        className={[
          BASE,
          SIZE_CLASS[size],
          size === 'sm' ? 'min-w-[16px] h-4 px-1' : 'min-w-[20px] h-5 px-1.5',
          'bg-brand-primary text-brand-on-primary justify-center tabular-nums',
          className,
        ].join(' ')}
        {...props}
      >
        {display}
      </span>
    );
  }

  // Status badge (dot + label)
  if (variant in STATUS_VARIANTS) {
    const { dot, text } = STATUS_VARIANTS[variant as keyof typeof STATUS_VARIANTS];
    return (
      <span
        ref={ref}
        className={[BASE, SIZE_CLASS[size], 'gap-1.5', text, className].join(' ')}
        {...props}
      >
        <span className={['shrink-0 size-1.5 rounded-full', dot].join(' ')} aria-hidden="true" />
        {children}
      </span>
    );
  }

  // Label badge
  return (
    <span
      ref={ref}
      className={[
        BASE,
        SIZE_CLASS[size],
        size === 'sm' ? 'px-1.5 py-px' : 'px-2 py-0.5',
        LABEL_VARIANTS[variant as keyof typeof LABEL_VARIANTS],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </span>
  );
});
