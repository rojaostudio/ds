import type { HTMLAttributes } from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerTone = 'neutral' | 'inverse';

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** sm 16 (inside a button or field), md 24 (next to text, the default), lg 32 (alone in an empty area). */
  size?: SpinnerSize;
  /**
   * neutral (default) on light surfaces; inverse on the dark brand band or a dark veil (Figma: `tone`).
   */
  tone?: SpinnerTone;
  /** What is happening (Figma: `label`). Always the accessible name; shown next to the ring with `showLabel`. */
  label?: string;
  /** Show the label next to the ring (Figma: `showLabel`). */
  showLabel?: boolean;
}

/**
 * Spinner — Figma [RDS] Indicators/Spinner. A wait without a known end (role="status"): a ring and a turning quarter
 * arc. When the wait can be measured, use the Progress. Styles: spinner.css.
 */
export function Spinner({
  size = 'md',
  tone = 'neutral',
  label = 'Carregando…',
  showLabel = false,
  className,
  ...rest
}: SpinnerProps) {
  return (
    <span
      {...rest}
      role="status"
      aria-label={showLabel ? undefined : label}
      className={['rds-spinner', `rds-spinner--${size}`, `rds-spinner--${tone}`, className].filter(Boolean).join(' ')}
    >
      {/* Figma: a full ring (track) and a quarter arc (indicator). */}
      <svg className="rds-spinner__ring" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="rds-spinner__track" cx="12" cy="12" r="10.5" fill="none" strokeWidth="3" />
        <path className="rds-spinner__indicator" d="M12 1.5 A10.5 10.5 0 0 1 22.5 12" fill="none" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {showLabel && <span className="rds-spinner__label">{label}</span>}
    </span>
  );
}
