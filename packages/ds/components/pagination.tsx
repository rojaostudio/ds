'use client';

import type { ComponentType, HTMLAttributes, ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './internal/icons';

export type PaginationLinkComponent = ComponentType<{
  href: string;
  className?: string;
  'aria-label'?: string;
  'aria-current'?: 'page';
  children: ReactNode;
}>;

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** The open page, from 1. */
  page: number;
  /** How many pages there are. */
  totalPages: number;
  /** Buttons: called with the page to open. Leave it out and pass `href` for links. */
  onChange?: (page: number) => void;
  /** Links: the address of each page. */
  href?: (page: number) => string;
  /** The link element when `href` is given (default `<a>`). Pass a framework Link to navigate on the client. */
  linkAs?: PaginationLinkComponent;
  /** The range and the total, on the left ("21–40 de 340"); never hide the total (Figma: `showSummary` + `summary`). */
  summary?: ReactNode;
  /** Pages shown on each side of the open one. Default 1. */
  siblings?: number;
  /** Pages always shown at the start and at the end. Default 1. */
  boundaries?: number;
  /** Render nothing when there is a single page. Default true. */
  hideOnSinglePage?: boolean;
}

type Entry = number | 'ellipsis-start' | 'ellipsis-end';

const range = (start: number, end: number) => Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);

/** First and last (`boundaries`), the open page and `siblings` on each side; a gap of one page shows the page, a longer one "…". */
export function pageItems(page: number, totalPages: number, siblings = 1, boundaries = 1): Entry[] {
  const wanted = new Set(
    [...range(1, boundaries), ...range(page - siblings, page + siblings), ...range(totalPages - boundaries + 1, totalPages)].filter(
      (p) => p >= 1 && p <= totalPages,
    ),
  );
  const sorted = [...wanted].sort((a, b) => a - b);
  const out: Entry[] = [];
  sorted.forEach((p, i) => {
    const previous = sorted[i - 1];
    if (previous !== undefined && p - previous > 1) {
      out.push(p - previous === 2 ? p - 1 : p < page ? 'ellipsis-start' : 'ellipsis-end');
    }
    out.push(p);
  });
  return out;
}

function Anchor({ children, ...props }: { href: string; className?: string; children: ReactNode }) {
  return <a {...props}>{children}</a>;
}

/**
 * Pagination — Figma [RDS] Navigation/Pagination. To walk a long list one page at a time: a <nav aria-label="Paginação">;
 * the open page has aria-current="page", every number is named "Página N", previous and next are named and turn
 * disabled at the ends. Buttons with `onChange`, links with `href`. Styles: pagination.css.
 */
export function Pagination({
  page,
  totalPages,
  onChange,
  href,
  linkAs: Link = Anchor,
  summary,
  siblings = 1,
  boundaries = 1,
  hideOnSinglePage = true,
  className,
  ...rest
}: PaginationProps) {
  if (hideOnSinglePage && totalPages <= 1 && !summary) return null;

  const control = (target: number, label: string, content: ReactNode, current = false) => {
    const off = target < 1 || target > totalPages;
    if (href && !off) {
      return (
        <Link href={href(target)} className="rds-pagination__item" aria-label={label} aria-current={current ? 'page' : undefined}>
          {content}
        </Link>
      );
    }
    return (
      <button
        type="button"
        className="rds-pagination__item"
        aria-label={label}
        aria-current={current ? 'page' : undefined}
        disabled={off}
        onClick={off ? undefined : () => onChange?.(target)}
      >
        {content}
      </button>
    );
  };

  const arrow = (icon: ReactNode) => (
    <span className="rds-pagination__icon" aria-hidden="true">
      {icon}
    </span>
  );

  return (
    <nav aria-label="Paginação" {...rest} className={['rds-pagination', className].filter(Boolean).join(' ')}>
      {summary && (
        <p className="rds-pagination__summary" aria-live="polite">
          {summary}
        </p>
      )}
      {!(hideOnSinglePage && totalPages <= 1) && (
        <ul className="rds-pagination__pages">
          <li>{control(page - 1, 'Página anterior', arrow(<ChevronLeftIcon />))}</li>
          {pageItems(page, totalPages, siblings, boundaries).map((entry) => (
            <li key={entry}>
              {typeof entry === 'string' ? (
                <span className="rds-pagination__item rds-pagination__item--ellipsis" aria-hidden="true">
                  …
                </span>
              ) : (
                control(entry, `Página ${entry}`, entry, entry === page)
              )}
            </li>
          ))}
          <li>{control(page + 1, 'Próxima página', arrow(<ChevronRightIcon />))}</li>
        </ul>
      )}
    </nav>
  );
}
