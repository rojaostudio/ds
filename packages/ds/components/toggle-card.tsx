'use client';

import type { ReactNode } from 'react';

export interface ToggleCardProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Hidden input name — when present, renders a hidden input so the value submits with native forms. */
  name?: string;
  children?: ReactNode;
}

export function ToggleCard({
  label,
  description,
  checked,
  onCheckedChange,
  name,
  children,
}: ToggleCardProps) {
  return (
    <div
      className={[
        'rounded-(--radius-card) overflow-hidden transition-colors border',
        checked
          ? '[border-color:var(--section-card-border-active)]'
          : '[border-color:var(--section-card-border)]',
      ].join(' ')}
    >
      {name && <input type="hidden" name={name} value={checked ? 'on' : ''} />}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={[
          'w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors',
          checked
            ? '[background:var(--section-card-header-bg-active)]'
            : 'hover:[background:var(--section-card-header-bg-hover)]',
        ].join(' ')}
      >
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span
            className={[
              'text-caption font-semibold uppercase tracking-wide',
              checked
                ? '[color:var(--section-card-label-active)]'
                : '[color:var(--section-card-label)]',
            ].join(' ')}
          >
            {label}
          </span>
          {description && (
            <span
              className={[
                'text-caption leading-snug',
                checked
                  ? '[color:var(--section-card-badge-active)]'
                  : '[color:var(--section-card-badge)]',
              ].join(' ')}
            >
              {description}
            </span>
          )}
        </div>
        <span
          aria-hidden
          className={[
            'relative inline-flex shrink-0 h-5 w-9 rounded-full transition-colors',
            checked
              ? 'bg-(--surface-default)/30'
              : 'bg-(--surface-raised) border border-stroke-default',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 inline-block h-4 w-4 rounded-full bg-(--surface-default) shadow-sm transition-transform',
              checked ? 'translate-x-[18px]' : 'translate-x-0.5',
            ].join(' ')}
          />
        </span>
      </button>
      {checked && children && (
        <div className="px-4 pb-4 pt-4 space-y-4 [border-top:1px_solid_var(--section-card-divider)] [background:var(--surface-default)]">
          {children}
        </div>
      )}
    </div>
  );
}
