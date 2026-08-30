import type { ReactNode } from 'react';

export type PageShellWidth = 'narrow' | 'default' | 'wide';

const WIDTH_CLS: Record<PageShellWidth, string> = {
  narrow:  'max-w-screen-md',
  default: 'max-w-screen-xl',
  wide:    'max-w-screen-2xl',
};

// ── Root ──────────────────────────────────────────────────────────────────────

export interface PageShellProps {
  maxWidth?: PageShellWidth;
  padded?: boolean;
  children: ReactNode;
  className?: string;
}

export function PageShell({
  maxWidth = 'default',
  padded = true,
  children,
  className = '',
}: PageShellProps) {
  return (
    <div
      className={[
        'mx-auto w-full',
        WIDTH_CLS[maxWidth],
        padded ? 'px-4 sm:px-6 lg:px-8 py-6' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
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

function PageShellHeader({ title, eyebrow, actions, className = '' }: PageShellHeaderProps) {
  return (
    <div className={['flex items-start justify-between gap-4 mb-6', className].filter(Boolean).join(' ')}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-caption font-medium text-fg-muted mb-1">{eyebrow}</p>
        )}
        <h1 className="text-heading-md font-semibold text-fg-primary truncate">{title}</h1>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}

// ── Body ──────────────────────────────────────────────────────────────────────

export interface PageShellBodyProps {
  children: ReactNode;
  className?: string;
}

function PageShellBody({ children, className = '' }: PageShellBodyProps) {
  return (
    <div className={['space-y-6', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

// ── Compose ───────────────────────────────────────────────────────────────────

PageShell.Header = PageShellHeader;
PageShell.Body   = PageShellBody;
