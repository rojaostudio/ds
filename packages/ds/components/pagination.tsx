/**
 * Pagination — navegação por páginas em listas longas.
 *
 * Uso:
 *   <Pagination
 *     page={2}
 *     totalPages={10}
 *     onChange={p => setPage(p)}
 *   />
 *
 *   <Pagination page={1} totalPages={20} onChange={...} siblings={2} />
 *
 * Renderiza: Prev | 1 ... 4 5 [6] 7 8 ... 20 | Next
 */

import { forwardRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  page:        number;       // 1-based
  totalPages:  number;
  onChange:    (page: number) => void;
  /** Páginas vizinhas a mostrar de cada lado da atual. default = 1. */
  siblings?:   number;
  /** Páginas fixas no início e no fim (sempre visíveis). default = 1. */
  boundaries?: number;
  className?:  string;
  /** Esconde quando totalPages <= 1. default = true. */
  hideOnSinglePage?: boolean;
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

type Item = number | 'ellipsis-left' | 'ellipsis-right';

function getRange(page: number, totalPages: number, siblings: number, boundaries: number): Item[] {
  const totalNumbers = siblings * 2 + boundaries * 2 + 3; // +current +2 ellipsis

  if (totalPages <= totalNumbers) return range(1, totalPages);

  const leftSiblingStart  = Math.max(page - siblings, boundaries + 2);
  const rightSiblingEnd   = Math.min(page + siblings, totalPages - boundaries - 1);

  const showLeftEllipsis  = leftSiblingStart > boundaries + 2;
  const showRightEllipsis = rightSiblingEnd  < totalPages - boundaries - 1;

  const items: Item[] = [];

  // Left boundary
  items.push(...range(1, boundaries));

  if (showLeftEllipsis) {
    items.push('ellipsis-left');
  } else if (boundaries + 1 < leftSiblingStart) {
    items.push(boundaries + 1);
  }

  items.push(...range(leftSiblingStart, rightSiblingEnd));

  if (showRightEllipsis) {
    items.push('ellipsis-right');
  } else if (rightSiblingEnd + 1 < totalPages - boundaries + 1) {
    items.push(rightSiblingEnd + 1);
  }

  // Right boundary
  items.push(...range(totalPages - boundaries + 1, totalPages));

  // Dedup (caso boundary e sibling se sobreponham)
  return Array.from(new Set(items.filter(i => typeof i === 'string' || (i >= 1 && i <= totalPages)))) as Item[];
}

const baseBtn = 'inline-flex items-center justify-center min-w-9 h-9 px-2 rounded-(--radius-control) text-label transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus';

export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination({
  page,
  totalPages,
  onChange,
  siblings = 1,
  boundaries = 1,
  className = '',
  hideOnSinglePage = true,
}: PaginationProps, ref) {
  if (hideOnSinglePage && totalPages <= 1) return null;

  const items = getRange(page, totalPages, siblings, boundaries);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <nav ref={ref} role="navigation" aria-label="Paginação" className={className}>
      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => canPrev && onChange(page - 1)}
            aria-label="Página anterior"
            className={[baseBtn, 'text-fg-secondary hover:bg-surface-raised'].join(' ')}
          >
            <ChevronLeft size={16} />
          </button>
        </li>
        {items.map((it, idx) => (
          <li key={`${it}-${idx}`}>
            {typeof it === 'string' ? (
              <span className="inline-flex items-center justify-center min-w-9 h-9 text-fg-muted text-label">
                …
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onChange(it)}
                aria-current={it === page ? 'page' : undefined}
                className={[
                  baseBtn,
                  it === page
                    ? 'bg-brand-primary text-brand-on-primary'
                    : 'text-fg-secondary hover:bg-surface-raised',
                ].join(' ')}
              >
                {it}
              </button>
            )}
          </li>
        ))}
        <li>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => canNext && onChange(page + 1)}
            aria-label="Próxima página"
            className={[baseBtn, 'text-fg-secondary hover:bg-surface-raised'].join(' ')}
          >
            <ChevronRight size={16} />
          </button>
        </li>
      </ul>
    </nav>
  );
});
