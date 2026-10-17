import type { ReactNode } from 'react';

/**
 * By the type of screen: narrow 768 (layout/content/max-width/narrow) for a record, a form or reading; medium 1152
 * (layout/content/max-width/medium) for a site or a marketing page; wide 1536 (layout/content/max-width/wide, the
 * default) for a list, a table or a detail; full, no cap, for a board, a kanban or a map.
 */
export type PageShellWidth = 'narrow' | 'medium' | 'wide' | 'full';

/**
 * Where content capped by maxWidth sits in a wider column: center (default) for a site or a screen without a menu;
 * start (the inline start, next to the side menu) in an app with a side menu. With full nothing is left over, so
 * align has no effect.
 */
export type PageShellAlign = 'start' | 'center';

// ── Root ──────────────────────────────────────────────────────────────────────

export interface PageShellProps {
  /**
   * The cap on the content's width, chosen by the type of screen (Figma: `maxWidth`): wide (default) up to 1536 for a
   * list, a table or a detail; narrow up to 768 for a record, a form or reading; medium up to 1152 for a site or a
   * marketing page; full with no cap for a board, a kanban or a map.
   */
  maxWidth?: PageShellWidth;
  /** center (default) or start, next to a side menu (Figma: `align`). No effect with full. */
  align?: PageShellAlign;
  /**
   * The page's margins (Figma: always on; `padded` is code only): layout/content/padding-y above and below and
   * layout/content/padding-x at the sides, by the screen's viewport mode (16; 24 from 640; 32 from 1024; 48 at the
   * sides from 1536). Default true; false takes them away.
   */
  padded?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * PageShell — Figma [RDS] Navigation/PageShell. The page container: at most `maxWidth` wide, centred or at the start,
 * with the page's gutters. The page's title is a PageHeader inside it; PageShell.Body stacks the sections 24 apart.
 *
 * Width by the type of screen: record, form, reading = narrow · site, marketing page = medium · list, table, detail =
 * wide · board, kanban, map = full.
 * In an app with a side menu, pass align="start". A bar fixed to the window lines up with the content through the same
 * gutter, layout/content/padding-x; a strip that scrolls sideways bleeds to the edge (the `bleed` of Tabs and
 * DataTableHeader). Styles: page-shell.css.
 */
export function PageShell({ maxWidth = 'wide', align = 'center', padded = true, children, className }: PageShellProps) {
  return (
    <div
      className={[
        'rds-page-shell',
        `rds-page-shell--${maxWidth}`,
        align === 'start' && 'rds-page-shell--align-start',
        padded && 'rds-page-shell--padded',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

// ── Body ──────────────────────────────────────────────────────────────────────

export interface PageShellBodyProps {
  children: ReactNode;
  className?: string;
}

function PageShellBody({ children, className }: PageShellBodyProps) {
  return <div className={['rds-page-shell__body', className].filter(Boolean).join(' ')}>{children}</div>;
}

// ── Compose ───────────────────────────────────────────────────────────────────

PageShell.Body   = PageShellBody;
