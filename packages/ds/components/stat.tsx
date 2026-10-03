'use client';

import { createContext, useContext, type HTMLAttributes, type ReactNode } from 'react';

/**
 * What the number means (Figma: `tone`): neutral (default), money in (success), a loss or a lack (danger), a counter
 * that asks for attention (warning).
 */
export type StatTone = 'neutral' | 'success' | 'danger' | 'warning';
/** 2.0.0-next names, deprecated: default → neutral, positive → success, negative → danger. */
export type LegacyStatTone = 'default' | 'positive' | 'negative';

const LEGACY_TONE: Record<string, StatTone> = { default: 'neutral', positive: 'success', negative: 'danger' };

/** The tone with the deprecated names mapped. */
export function statTone(tone: StatTone | LegacyStatTone): StatTone {
  return LEGACY_TONE[tone] ?? (tone as StatTone);
}

export interface StatProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** What is counted (Figma: `label`): "Pedidos no mês". */
  label: ReactNode;
  /** The number, already formatted by the caller (Figma: `value`): "1.284", "R$ 48.320". */
  value: ReactNode;
  /**
   * Paints the number (Figma: `tone`). `'default'`, `'positive'` and `'negative'` are deprecated (2.0.0-next): they
   * are neutral, success and danger.
   */
  tone?: StatTone | LegacyStatTone;
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
}

/** Set by the SummaryBar: a Stat inside it is a cell (framed=false) unless it says otherwise. */
export const StatFramedDefault = createContext(true);

/**
 * Stat — Figma [RDS] Content/Stat. A number that matters, with its label, the change (Delta) and, when it helps,
 * the trend (Sparkline). Alone it is a card; in a SummaryBar it is a cell. Styles: stat.css.
 */
export function Stat({ label, value, tone = 'neutral', muted = false, caption, delta, sparkline, framed, className, ...rest }: StatProps) {
  const framedDefault = useContext(StatFramedDefault);
  const isFramed = framed ?? framedDefault;
  return (
    <div {...rest} className={['rds-stat', `rds-stat--${statTone(tone)}`, muted && 'rds-stat--muted', isFramed && 'rds-stat--framed', className].filter(Boolean).join(' ')}>
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
