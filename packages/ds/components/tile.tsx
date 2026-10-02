import type { HTMLAttributes, ReactNode } from 'react';

export type TileTone = 'action' | 'neutral' | 'info' | 'success' | 'warning' | 'danger';
/** Figma calls this property `style`; here it is `variant` because `style` belongs to React. */
export type TileVariant = 'fill' | 'soft';
export type TileSize = 'sm' | 'default' | 'lg';

export interface TileProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The icon (Figma: `icon`), an inline SVG. The Tile sizes it: 16, 24 or 32. */
  icon: ReactNode;
  /** action is the brand; the others follow feedback: success only for what went right, danger for what went wrong. */
  tone?: TileTone;
  /** fill is strong; soft is light, with the icon in the tone's colour (Figma: `style`). Same variant across a list. */
  variant?: TileVariant;
  /** sm 32, default 48, lg 64. */
  size?: TileSize;
}

/**
 * Tile — Figma [RDS] Content/Tile. An icon with weight, in a circle: a benefit in a list, a card's header, the top
 * of an empty state. Decorative (aria-hidden): the text beside it says what it is. Not clickable. Styles: tile.css.
 */
export function Tile({ icon, tone = 'action', variant = 'fill', size = 'default', className, ...rest }: TileProps) {
  return (
    <span
      aria-hidden="true"
      {...rest}
      className={['rds-tile', `rds-tile--${tone}-${variant}`, `rds-tile--${size}`, className].filter(Boolean).join(' ')}
    >
      {icon}
    </span>
  );
}
