import type { CSSProperties, HTMLAttributes } from 'react';

export type SkeletonShape = 'line' | 'circle' | 'rect';

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** line for text (16 tall), circle for an avatar (40), rect for an image or a card (120 tall). */
  shape?: SkeletonShape;
  /** The size of what is coming (a number is px). line and rect fill the width by default. */
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
}

/**
 * Skeleton — Figma [RDS] Content/Skeleton. The place of content while it loads. Always aria-hidden: put
 * aria-busy="true" on the loading region and a "Carregando…" text only for screen readers. Styles: skeleton.css.
 */
export function Skeleton({ shape = 'line', width, height, className, style, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      {...rest}
      className={['rds-skeleton', `rds-skeleton--${shape}`, className].filter(Boolean).join(' ')}
      style={{ width, height, ...style }}
    />
  );
}
