'use client';

import { useRef, useState, type ComponentType, type HTMLAttributes, type ReactNode } from 'react';
import { ChevronRightIcon } from './internal/icons';

export interface BreadcrumbItem {
  label: string;
  /** Where the step leads. The last step is the current page and never gets a link. */
  href?: string;
}

export type BreadcrumbLinkComponent = ComponentType<{ href: string; className?: string; children: ReactNode }>;

export interface BreadcrumbProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The path, from the most general to the current page, the last one (Figma: the `items` slot). */
  items: BreadcrumbItem[];
  /** More steps than this: the middle ones hide behind "…", a button that shows the whole path. */
  maxItems?: number;
  /** The link element (default `<a>`). Pass a framework Link (Next's `Link`) to navigate on the client. */
  linkAs?: BreadcrumbLinkComponent;
}

function Anchor({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

/**
 * Breadcrumb — Figma [RDS] Navigation/Breadcrumb. The path to the current page: a <nav aria-label="Caminho"> with an
 * <ol>; the current step has aria-current="page" and no link; the arrows are hidden from screen readers. Over the
 * brand colour, put it in a brand-mode scope (`.ds-plate`). Styles: breadcrumb.css.
 */
export function Breadcrumb({ items, maxItems = 4, linkAs: Link = Anchor, className, ...rest }: BreadcrumbProps) {
  const [expanded, setExpanded] = useState(false);
  const list = useRef<HTMLOListElement>(null);
  const collapse = !expanded && items.length > maxItems;
  const shown: (BreadcrumbItem | 'ellipsis')[] = collapse ? [items[0]!, 'ellipsis', ...items.slice(-2)] : items;

  const expand = () => {
    setExpanded(true);
    // The button leaves; the focus goes to the first step it was hiding.
    requestAnimationFrame(() => list.current?.children[1]?.querySelector<HTMLElement>('a')?.focus());
  };

  return (
    <nav
      aria-label="Caminho"
      {...rest}
      className={['rds-breadcrumb', className].filter(Boolean).join(' ')}
    >
      <ol ref={list} className="rds-breadcrumb__list">
        {shown.map((step, index) => {
          const last = index === shown.length - 1;
          return (
            <li key={step === 'ellipsis' ? 'ellipsis' : `${index}-${step.label}`} className="rds-breadcrumb__item">
              {step === 'ellipsis' ? (
                <button type="button" className="rds-breadcrumb__link" aria-label="Mostrar o caminho completo" onClick={expand}>
                  …
                </button>
              ) : last ? (
                <span className="rds-breadcrumb__link rds-breadcrumb__link--current" aria-current="page">
                  {step.label}
                </span>
              ) : step.href ? (
                <Link href={step.href} className="rds-breadcrumb__link">
                  {step.label}
                </Link>
              ) : (
                <span className="rds-breadcrumb__link">{step.label}</span>
              )}
              {!last && (
                <span className="rds-breadcrumb__separator" aria-hidden="true">
                  <ChevronRightIcon />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
