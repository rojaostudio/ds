import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
/**
 * The emphasis (Figma: `variant`): outline (white pill with a hairline, for coloured bands), soft (light plate
 * with the tone's dark text, for dark backgrounds), fill (the tone's plate, for neutral backgrounds).
 */
export type StatusVariant = 'outline' | 'soft' | 'fill';
export type StatusSize = 'md' | 'sm';

export interface StatusProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The state, in one or two words (Figma: `label`). The text says the state; the dot only adds colour. */
  children: ReactNode;
  /** neutral (a record: draft, closed), info (in progress), success (done), warning (pending), danger (failed). */
  tone?: StatusTone;
  variant?: StatusVariant;
  /** md 32 tall (default); sm 24 (dot 6), for narrow cards and table rows. */
  size?: StatusSize;
  /**
   * The dot's own colour, for a category or a stage (queue, production, ready): a token from the product's theme
   * (`var(--…)`).
   * Only with tone="neutral": the plate and the word stay neutral, the colour is an accent (Figma: the `dot` fill).
   */
  dotColor?: string;
}

/**
 * Status — Figma [RDS] Indicators/Status. A state that changes over time ("Em análise", "Concluído"): a pill with a
 * dot and the word. A fixed attribute is a Badge. When it changes without a reload, put aria-live="polite" on the
 * surrounding region, not here. Styles: status.css.
 */
export function Status({
  tone = 'neutral',
  variant = 'outline',
  size = 'md',
  dotColor,
  children,
  className,
  style,
  ...rest
}: StatusProps) {
  return (
    <span
      {...rest}
      style={dotColor ? ({ ...style, '--_dot': dotColor } as CSSProperties) : style}
      className={['rds-status', `rds-status--${tone}-${variant}`, `rds-status--${size}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="rds-status__dot" aria-hidden="true" />
      {children}
    </span>
  );
}
