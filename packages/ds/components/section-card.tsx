'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

export interface SectionCardProps {
  label: string;
  /** Secondary text shown beside the label (e.g. a subtitle or count) */
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function SectionCard({ label, badge, open, onToggle, children }: SectionCardProps) {
  return (
    <div
      className={[
        'rounded-(--radius-card) overflow-hidden transition-colors border',
        open
          ? '[border-color:var(--section-card-border-active)]'
          : '[border-color:var(--section-card-border)]',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={onToggle}
        className={[
          'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
          open
            ? '[background:var(--section-card-header-bg-active)]'
            : 'hover:[background:var(--section-card-header-bg-hover)]',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={[
              'text-caption font-semibold uppercase tracking-wide shrink-0',
              open
                ? '[color:var(--section-card-label-active)]'
                : '[color:var(--section-card-label)]',
            ].join(' ')}
          >
            {label}
          </span>
          {badge && (
            <span
              className={[
                'text-caption truncate min-w-0',
                open
                  ? '[color:var(--section-card-badge-active)]'
                  : '[color:var(--section-card-badge)]',
              ].join(' ')}
            >
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 shrink-0 [color:var(--section-card-chevron)]" />
          : <ChevronRight className="w-4 h-4 shrink-0 [color:var(--section-card-chevron)]" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-4 space-y-4 [border-top:1px_solid_var(--section-card-divider)] [background:var(--surface-default)]">
          {children}
        </div>
      )}
    </div>
  );
}
