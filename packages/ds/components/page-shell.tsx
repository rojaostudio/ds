import type { ReactNode } from 'react';

/** narrow 768 (layout/form/max-width), for a form or for reading; wide 1536 (the Base's 1536 step), the default. */
export type PageShellWidth = 'narrow' | 'wide';

// ── Root ──────────────────────────────────────────────────────────────────────

export interface PageShellProps {
  /** wide (default) up to 1536; narrow up to 768, for a form or for reading (Figma: `maxWidth`). */
  maxWidth?: PageShellWidth;
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
 * PageShell — the page container: centred, at most `maxWidth` wide, with the page's gutters. The page's title is a
 * PageHeader inside it; PageShell.Body stacks the sections 24 apart. Styles: page-shell.css.
 */
export function PageShell({ maxWidth = 'wide', padded = true, children, className }: PageShellProps) {
  return (
    <div className={['rds-page-shell', `rds-page-shell--${maxWidth}`, padded && 'rds-page-shell--padded', className].filter(Boolean).join(' ')}>
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
