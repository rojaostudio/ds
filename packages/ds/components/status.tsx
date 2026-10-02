import type { HTMLAttributes, ReactNode } from 'react';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
/**
 * Figma calls this property `style`: outline (white pill with a hairline, for coloured bands), soft (light plate
 * with the tone's dark text, for dark backgrounds), fill (the tone's plate, for neutral backgrounds).
 */
export type StatusVariant = 'outline' | 'soft' | 'fill';
export type StatusSize = 'default' | 'sm';

export interface StatusProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The state, in one or two words (Figma: `label`). The text says the state; the dot only adds colour. */
  children: ReactNode;
  /** neutral (a record: draft, closed), info (in progress), success (done), warning (pending), danger (failed). */
  tone?: StatusTone;
  variant?: StatusVariant;
  /** default 32 tall; sm 24 (dot 6), for narrow cards and table rows. */
  size?: StatusSize;
}

/**
 * Status — Figma [RDS] Indicators/Status. A state that changes over time ("Em análise", "Concluído"): a pill with a
 * dot and the word. A fixed attribute is a Badge. When it changes without a reload, put aria-live="polite" on the
 * surrounding region, not here. Styles: status.css.
 */
export function Status({
  tone = 'neutral',
  variant = 'outline',
  size = 'default',
  children,
  className,
  ...rest
}: StatusProps) {
  return (
    <span
      {...rest}
      className={['rds-status', `rds-status--${tone}-${variant}`, `rds-status--${size}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="rds-status__dot" aria-hidden="true" />
      {children}
    </span>
  );
}
