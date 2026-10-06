'use client';

import { Children, type HTMLAttributes, type ReactNode } from 'react';
import { StatFramedDefault } from './stat';

/** row: the wide screen, the cells share the width (many scroll sideways). grid: the phone, two columns. */
export type SummaryBarLayout = 'row' | 'grid';

export interface SummaryBarProps extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
  /** The Stats (Figma: slot `items`). Inside the bar a Stat is a cell (framed=false) by default. */
  children: ReactNode;
  /** Figma: `layout`. In grid, the last cell takes the whole line when the count is odd. */
  layout?: SummaryBarLayout;
}

/**
 * SummaryBar — Figma [RDS] Content/SummaryBar. The strip of aggregated numbers above a list (stock, finance,
 * report): Stats 1px apart, the gap showing summary-bar/divider. A list: each Stat is an item. Styles: summary-bar.css.
 */
export function SummaryBar({ children, layout = 'row', className, ...rest }: SummaryBarProps) {
  const cells = Children.toArray(children);
  return (
    <StatFramedDefault.Provider value={false}>
      <ul {...rest} className={['rds-summary-bar', `rds-summary-bar--${layout}`, className].filter(Boolean).join(' ')}>
        {cells.map((cell, i) => (
          <li key={i} className="rds-summary-bar__cell">
            {cell}
          </li>
        ))}
      </ul>
    </StatFramedDefault.Provider>
  );
}
