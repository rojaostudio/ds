import { Card } from './card';
import { Skeleton } from './skeleton';

/**
 * PageSkeleton and CardsSkeleton — compositions of the Skeleton (Figma [RDS] Content/Skeleton) inside Cards: the
 * loading state of a page, in the shape of what is coming. The region is aria-busy and says "Carregando…" to
 * screen readers only; the shapes are hidden from them. Styles: page-skeleton.css.
 */

export interface PageSkeletonProps {
  /** How many table rows. Default 5. */
  rows?: number;
  /** The page's padding (24). Turn it off inside a container that already pads. Default true. */
  padded?: boolean;
  /** What screen readers hear. */
  label?: string;
}

/** A page with a table: the title and a button, then the table's header and `rows` rows. */
export function PageSkeleton({ rows = 5, padded = true, label = 'Carregando…' }: PageSkeletonProps) {
  return (
    <div className={['rds-page-skeleton', padded && 'rds-page-skeleton--padded'].filter(Boolean).join(' ')} role="status" aria-busy="true">
      <span className="rds-visually-hidden">{label}</span>
      <div className="rds-page-skeleton__heading">
        <Skeleton width={192} height={28} />
        <Skeleton shape="rect" width={112} height={36} />
      </div>
      <Card as="div" size="sm" className="rds-page-skeleton__table">
        <div className="rds-page-skeleton__row rds-page-skeleton__row--head">
          <Skeleton width={128} />
          <Skeleton width={96} />
          <Skeleton width={80} />
        </div>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="rds-page-skeleton__row">
            <Skeleton width={160} />
            <Skeleton width={112} />
            <Skeleton width={64} />
            <Skeleton width={80} className="rds-page-skeleton__end" />
          </div>
        ))}
      </Card>
    </div>
  );
}

export interface CardsSkeletonProps {
  /** How many indicator cards. Default 4. */
  count?: number;
  /** The page's padding (24). Turn it off inside a container that already pads. Default true. */
  padded?: boolean;
  /** What screen readers hear. */
  label?: string;
}

/** A page of indicators: the title, `count` cards (2 per row, 4 from 1024) and two charts. */
export function CardsSkeleton({ count = 4, padded = true, label = 'Carregando…' }: CardsSkeletonProps) {
  return (
    <div className={['rds-page-skeleton', padded && 'rds-page-skeleton--padded'].filter(Boolean).join(' ')} role="status" aria-busy="true">
      <span className="rds-visually-hidden">{label}</span>
      <Skeleton width={192} height={28} />
      <div className="rds-page-skeleton__grid rds-page-skeleton__grid--stats">
        {Array.from({ length: count }, (_, i) => (
          <Card key={i} as="div" size="sm" className="rds-page-skeleton__card">
            <Skeleton width={96} />
            <Skeleton width={128} height={32} />
            <Skeleton width={80} height={12} />
          </Card>
        ))}
      </div>
      <div className="rds-page-skeleton__grid rds-page-skeleton__grid--charts">
        {[0, 1].map((i) => (
          <Card key={i} as="div" size="sm" className="rds-page-skeleton__card">
            <Skeleton width={128} height={20} />
            <Skeleton shape="rect" height={128} />
          </Card>
        ))}
      </div>
    </div>
  );
}
