import type { HTMLAttributes, ReactNode } from 'react';
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from './internal/icons';

export type DeltaDirection = 'up' | 'down' | 'flat';
/** Whether the change is good (success), bad (danger) or just information (neutral). Not the direction. */
export type DeltaTone = 'neutral' | 'success' | 'danger';

export interface DeltaProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** How much it changed, with the unit (Figma: `value`): "24%", "3,5 pp". */
  children: ReactNode;
  /** Where the number went (Figma: `direction`). */
  direction?: DeltaDirection;
  /** Whether that is good: going up is not always good (Figma: `tone`). */
  tone?: DeltaTone;
  /**
   * What a screen reader hears before the value, since the arrow is hidden from it. Defaults to a word for the
   * direction ("Subiu", "Caiu", "Sem mudança"); pass the full sentence when there is context, such as the period.
   */
  srPrefix?: string;
}

const ARROWS = { up: ArrowUpIcon, down: ArrowDownIcon, flat: MinusIcon };
const SR_PREFIX: Record<DeltaDirection, string> = { up: 'Subiu', down: 'Caiu', flat: 'Sem mudança' };

/**
 * Delta — Figma [RDS] Indicators/Delta. The change of a number against the previous period: an arrow and the value.
 * Styles: delta.css.
 */
export function Delta({ direction = 'up', tone = 'neutral', srPrefix, children, className, ...rest }: DeltaProps) {
  const Arrow = ARROWS[direction];
  return (
    <span {...rest} className={['rds-delta', `rds-delta--${tone}`, className].filter(Boolean).join(' ')}>
      <span className="rds-delta__icon" aria-hidden="true">
        <Arrow />
      </span>
      <span className="rds-visually-hidden">{srPrefix ?? SR_PREFIX[direction]} </span>
      {children}
    </span>
  );
}
