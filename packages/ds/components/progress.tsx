'use client';

import { useId, type HTMLAttributes, type ReactNode } from 'react';

/** task: something moving to the end (upload, import). measure: a value inside a known range (quota used). */
export type ProgressKind = 'task' | 'measure';
export type ProgressSize = 'md' | 'sm';

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 0 to `max` (Figma: `value`, 0 to 100 in steps of 5; the code takes any value). */
  value: number;
  max?: number;
  /** What the bar measures (Figma: `label`). Always required: hidden with `showLabel={false}`, it still names the bar. */
  label: string;
  /** Show the label above the bar (Figma: `showLabel`). */
  showLabel?: boolean;
  /** Show the value on the right (Figma: `showValue`). */
  showValue?: boolean;
  /** The value as text, shown and read ("75%", "750 de 1.000"). Defaults to the percentage. */
  valueText?: ReactNode;
  /** task → role="progressbar"; measure → role="meter". */
  kind?: ProgressKind;
  /** md: 8px bar (default); sm: 4px, for dense lists (Figma: `size`). */
  size?: ProgressSize;
}

/**
 * Progress — Figma [RDS] Indicators/Progress. A bar with a value: the track is the brand tint, the fill the first
 * data colour. A wait without a known end is the Spinner. Styles: progress.css.
 */
export function Progress({
  value,
  max = 100,
  label,
  showLabel = true,
  showValue = true,
  valueText,
  kind = 'task',
  size = 'md',
  className,
  ...rest
}: ProgressProps) {
  const labelId = useId();
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? (clamped / max) * 100 : 0;
  const text = valueText ?? `${Math.round(percent)}%`;
  return (
    <div {...rest} className={['rds-progress', `rds-progress--${size}`, className].filter(Boolean).join(' ')}>
      {(showLabel || showValue) && (
        <div className="rds-progress__row">
          {showLabel && (
            <span id={labelId} className="rds-progress__label">
              {label}
            </span>
          )}
          {showValue && (
            <span className="rds-progress__value" aria-hidden="true">
              {text}
            </span>
          )}
        </div>
      )}
      <div
        className="rds-progress__track"
        role={kind === 'task' ? 'progressbar' : 'meter'}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={typeof text === 'string' ? text : undefined}
        {...(showLabel ? { 'aria-labelledby': labelId } : { 'aria-label': label })}
      >
        <div className="rds-progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
