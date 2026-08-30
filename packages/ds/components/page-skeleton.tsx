import { Skeleton } from './skeleton';

/**
 * PageSkeleton — loading state padrão pra páginas com tabela.
 * Header (título + botão) + tabela com header + N rows.
 *
 * `padded` (default true) controla o padding interno. Use `padded={false}`
 * quando o skeleton já vive dentro de um container que aplica padding
 * (ex.: PageRoot/PageLayout), evitando padding duplicado.
 *
 * Uso:
 *   <PageSkeleton rows={8} />
 *   <PageSkeleton rows={8} padded={false} />  // dentro de um container
 */

export interface PageSkeletonProps {
  rows?: number;
  padded?: boolean;
}

export function PageSkeleton({ rows = 5, padded = true }: PageSkeletonProps) {
  return (
    <div className={`space-y-6 ${padded ? 'p-6' : ''}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="border border-stroke-default rounded-(--radius-card) overflow-hidden">
        <div className="bg-surface-raised border-b border-stroke-default px-4 py-3 flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 flex gap-4 items-center border-b border-stroke-subtle last:border-0">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CardsSkeleton — loading state pra páginas com KPIs (4 cards no topo + 2 charts).
 *
 * `padded` (default true) — ver PageSkeleton.
 *
 * Uso:
 *   <CardsSkeleton count={4} />
 *   <CardsSkeleton count={4} padded={false} />  // dentro de um container
 */
export interface CardsSkeletonProps {
  count?: number;
  padded?: boolean;
}

export function CardsSkeleton({ count = 4, padded = true }: CardsSkeletonProps) {
  return (
    <div className={`space-y-6 ${padded ? 'p-6' : ''}`}>
      <Skeleton className="h-7 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="border border-stroke-default rounded-(--radius-card) p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border border-stroke-default rounded-(--radius-card) p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
