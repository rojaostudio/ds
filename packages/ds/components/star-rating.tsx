import type { HTMLAttributes, ReactNode } from 'react';
import { StarFilledIcon, StarIcon } from './internal/icons';

export type StarRatingSize = 'sm' | 'md' | 'lg';

export interface StarRatingProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** 0 to 5, rounded to the nearest half (Figma: `value`). */
  value: number;
  /** sm: 16 stars and 12 text; md (default): 20 and 14; lg: 24 and 14 (Figma: `size`). `'default'` is deprecated (2.0.0-next): it is `'md'`. */
  size?: StarRatingSize | 'default';
  /**
   * The written grade, such as the value and how many reviews (Figma: `showLabel` + `label`): "4,5 (128
   * avaliações)". Show it: the yellow star alone has too little contrast to be the only cue.
   */
  label?: ReactNode;
}

const format = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/**
 * StarRating — Figma [RDS] Indicators/StarRating. The average rating in stars, read only: the stars are one image
 * named "Nota 4,5 de 5". For the person to give a grade, it is another component. Styles: star-rating.css.
 */
export function StarRating({ value, size = 'md', label, className, ...rest }: StarRatingProps) {
  const rounded = Math.round(Math.min(Math.max(value, 0), 5) * 2) / 2;
  return (
    <span {...rest} className={['rds-rating', `rds-rating--${size === 'default' ? 'md' : size}`, className].filter(Boolean).join(' ')}>
      <span className="rds-rating__stars" role="img" aria-label={`Nota ${format(rounded)} de 5`}>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = rounded >= i ? 'full' : rounded >= i - 0.5 ? 'half' : 'empty';
          return (
            <span key={i} className={`rds-rating__star rds-rating__star--${fill}`} aria-hidden="true">
              {fill !== 'full' && (
                <span className="rds-rating__empty">
                  <StarIcon />
                </span>
              )}
              {fill !== 'empty' && (
                <span className="rds-rating__fill">
                  <StarFilledIcon />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {label && <span className="rds-rating__label">{label}</span>}
    </span>
  );
}
