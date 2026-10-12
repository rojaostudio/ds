import type { HTMLAttributes, ReactNode } from 'react';

/** The role (Figma: `tone`). Over the brand colour, apply the theme's brand mode to the band (`.ds-plate`) with neutral. */
export type BadgeTone = 'neutral' | 'action' | 'accent';
/** The emphasis (Figma: `variant`): fill (solid) or soft (a light plate; on accent, the brand's highlighter). */
export type BadgeVariant = 'fill' | 'soft';
/** The height (Figma: `size`): md 32 (default); sm 24, beside the title of a row (Item, table cell) without growing it. */
export type BadgeSize = 'md' | 'sm';

interface BadgeBase extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The label (Figma: `label`): "Nova", "Grátis". Ignored when `value` is given. */
  children?: ReactNode;
  /** Counter mode (Figma: `number=true` + `value`). Above 99 it shows "99+". */
  value?: number;
  /** The height (Figma: `size`). */
  size?: BadgeSize;
}

/**
 * Every tone has fill and soft (as in Figma). On accent, soft is the brand's highlighter
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
  );

export function formatBadgeValue(value: number) {
  return value > 99 ? '99+' : String(value);
}

/**
 * Badge — Figma [RDS] Indicators/Badge. A short brand or layout label ("Nova", "Grátis") or a counter. Not
 * interactive and not a state: a state that changes over time is the Status. Styles: badge.css.
 */
export function Badge({ tone = 'neutral', variant = 'fill', size = 'md', value, children, className, ...rest }: BadgeProps) {
  const isNumber = value !== undefined;
  const emphasis = variant === 'highlight' ? 'soft' : variant;
  return (
    <span
      {...rest}
      className={['rds-badge', `rds-badge--${tone}-${emphasis}`, size === 'sm' && 'rds-badge--sm', isNumber && 'rds-badge--number', className]
        .filter(Boolean)
        .join(' ')}
    >
      {isNumber ? formatBadgeValue(value) : children}
    </span>
  );
}
