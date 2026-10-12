'use client';

import { createContext, useContext, type HTMLAttributes, type ReactNode } from 'react';
import { Skeleton } from './skeleton';

/**
 * What the number means (Figma: `tone`): neutral (default), money in (success), a loss or a lack (danger), a counter
 * that asks for attention (warning).
 */
export type StatTone = 'neutral' | 'success' | 'danger' | 'warning';

export interface StatProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** What is counted (Figma: `label`): "Pedidos no mês". */
  label: ReactNode;
  /** The number, already formatted by the caller (Figma: `value`): "1.284", "R$ 48.320". */
  value: ReactNode;
  /** Paints the number (Figma: `tone`). */
  tone?: StatTone;
  /** A zero, nothing to see: the number in the muted colour (Figma: `muted`), over the neutral tone. */
  muted?: boolean;
  /** A line under the number (Figma: `showCaption` + `caption`): "vs. 1.142 em agosto". */
  caption?: ReactNode;
  /** The change, a Delta beside the number (Figma: `showDelta` + the exposed Delta). */
  delta?: ReactNode;
  /** The trend, a Sparkline under the text (Figma: `showSparkline` + the exposed Sparkline). */
  sparkline?: ReactNode;
  /**
   * On its own card surface with a border (Figma: `framed=true`, the default). Inside a SummaryBar it is false by
   * default: the cell of the strip, no border.
   */
  framed?: boolean;
  /**
   * On the brand's dark fill (Figma: `inverse`), for the one number that leads a page: background surface/inverse,
   * value in text/on-inverse, label and caption in text/on-inverse-subtle, and the Delta inside turns inverse by
   * itself. Only framed, with tone neutral and not muted (the Figma draws no other); otherwise it is ignored.
   */
  inverse?: boolean;
  /**
   * The number has not arrived (Figma: `loading=true`): label, value and caption become Skeleton lines in rows as tall
   * as the text, so the Stat keeps its height and a grid of them does not jump when the numbers come. aria-busy; the
   * label stays for screen readers. The caption and sparkline placeholders follow `caption` and `sparkline`.
   */
  loading?: boolean;
}

/** Set by the SummaryBar: a Stat inside it is a cell (framed=false) unless it says otherwise. */
export const StatFramedDefault = createContext(true);

/**
 * Stat — Figma [RDS] Content/Stat. A number that matters, with its label, the change (Delta) and, when it helps,
 * the trend (Sparkline). Alone it is a card; in a SummaryBar it is a cell. Styles: stat.css.
 */
export function Stat({
  label,
  value,
  tone = 'neutral',
  muted = false,
  caption,
  delta,
  sparkline,
  framed,
  inverse = false,
  loading = false,
  className,
  ...rest
}: StatProps) {
  const framedDefault = useContext(StatFramedDefault);
  const isFramed = framed ?? framedDefault;
  const isInverse = inverse && isFramed && tone === 'neutral' && !muted;
  if (inverse && !isInverse) console.warn('[@rojaostudio/ds] Stat inverse needs framed, tone="neutral" and no muted: ignored.');
  if (loading) {
    return (
      <div
        aria-busy="true"
        {...rest}
        className={['rds-stat', 'rds-stat--loading', isFramed && 'rds-stat--framed', className].filter(Boolean).join(' ')}
      >
        <div className="rds-stat__pair">
          <span className="rds-stat__label">
            <span className="rds-visually-hidden">{label}</span>
            <Skeleton width={88} height={14} />
          </span>
          <span className="rds-stat__row">
            <Skeleton width={112} height={24} />
          </span>
          {caption && (
            <span className="rds-stat__caption">
              <Skeleton width={120} height={12} />
            </span>
          )}
        </div>
        {sparkline && <Skeleton shape="rect" height={32} />}
      </div>
    );
  }
  return (
    <div
      {...rest}
      className={[
        'rds-stat',
        `rds-stat--${tone}`,
        muted && 'rds-stat--muted',
        isFramed && 'rds-stat--framed',
        isInverse && 'rds-stat--inverse',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="rds-stat__pair">
        <span className="rds-stat__label">{label}</span>
        <span className="rds-stat__row">
          <span className="rds-stat__value">{value}</span>
          {delta}
        </span>
        {caption && <span className="rds-stat__caption">{caption}</span>}
      </div>
      {sparkline}
    </div>
  );
}
