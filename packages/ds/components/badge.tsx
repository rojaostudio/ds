import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'action' | 'accent' | 'inverse';
/** The emphasis (Figma: `variant`): fill (solid) or soft (a light plate; on accent, the brand's highlighter). */
export type BadgeVariant = 'fill' | 'soft';

interface BadgeBase extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The label (Figma: `label`): "Nova", "Grátis". Ignored when `value` is given. */
  children?: ReactNode;
  /** Counter mode (Figma: `number=true` + `value`). Above 99 it shows "99+". */
  value?: number;
}

/**
 * Not every tone has every variant (as in Figma): inverse is only fill. On accent, soft is the brand's highlighter
 * (the old `highlight`). The types allow only those.
 */
export type BadgeProps = BadgeBase &
  (
    | { tone?: 'neutral' | 'action'; variant?: BadgeVariant }
    | {
        tone: 'accent';
        /** `'highlight'` is deprecated (2.0.0-next): it is `variant="soft"` on `tone="accent"`. */
        variant?: BadgeVariant | 'highlight';
      }
    | { tone: 'inverse'; variant?: 'fill' }
  );

export function formatBadgeValue(value: number) {
  return value > 99 ? '99+' : String(value);
}

/**
 * Badge — Figma [RDS] Indicators/Badge. A short brand or layout label ("Nova", "Grátis") or a counter. Not
 * interactive and not a state: a state that changes over time is the Status. Styles: badge.css.
 */
export function Badge({ tone = 'neutral', variant = 'fill', value, children, className, ...rest }: BadgeProps) {
  const isNumber = value !== undefined;
  const emphasis = variant === 'highlight' ? 'soft' : variant;
  return (
    <span
      {...rest}
      className={['rds-badge', `rds-badge--${tone}-${emphasis}`, isNumber && 'rds-badge--number', className]
        .filter(Boolean)
        .join(' ')}
    >
      {isNumber ? formatBadgeValue(value) : children}
    </span>
  );
}
