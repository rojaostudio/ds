import type { ReactNode } from 'react';
import { PageHeader } from './page-header';

export type PageShellWidth = 'narrow' | 'default' | 'wide';

// ── Root ──────────────────────────────────────────────────────────────────────

export interface PageShellProps {
  /** narrow 768, default 1280, wide 1536. */
  maxWidth?: PageShellWidth;
  /** The page's gutters: 24 on top and bottom, 16 on the sides (24 from 640, 32 from 1024). Default true. */
  padded?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * PageShell — the page container: centred, at most `maxWidth` wide, with the page's gutters. PageShell.Header is
 * the PageHeader (deprecated wrapper) and PageShell.Body stacks the sections 24 apart. Styles: page-shell.css.
 */
export function PageShell({ maxWidth = 'default', padded = true, children, className }: PageShellProps) {
  return (
    <div className={['rds-page-shell', `rds-page-shell--${maxWidth}`, padded && 'rds-page-shell--padded', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

export interface PageShellHeaderProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * @deprecated Use PageHeader (Figma [RDS] Navigation/PageHeader). A thin wrapper over it: title and actions pass
 * through; eyebrow (not in the Figma) becomes the description line.
 */
function PageShellHeader({ title, eyebrow, actions, className }: PageShellHeaderProps) {
  return <PageHeader title={title} description={eyebrow} actions={actions} className={['rds-page-shell__header', className].filter(Boolean).join(' ')} />;
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

PageShell.Header = PageShellHeader;
PageShell.Body   = PageShellBody;
