'use client';

import type { ReactNode } from 'react';
import { Pencil } from 'lucide-react';

export interface ToggleCardCompactProps {
  icon?: ReactNode;
  label: string;
  /** Texto mostrado quando OFF. Substituído por `summary` quando ON. */
  description?: ReactNode;
  /** Texto mostrado quando ON (geralmente um resumo da config aplicada). */
  summary?: ReactNode;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Botão de edição (pencil). Só aparece quando ON. Use para abrir modal de config. */
  onEdit?: () => void;
  editLabel?: string;
  /** Hidden input name — quando presente, submete em forms nativos. */
  name?: string;
}

export function ToggleCardCompact({
  icon,
  label,
  description,
  summary,
  checked,
  onCheckedChange,
  onEdit,
  editLabel = 'Editar',
  name,
}: ToggleCardCompactProps) {
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
      <div
        className={[
          'flex items-center gap-3 px-4 py-3 transition-colors',
          checked ? '[background:var(--section-card-header-bg-active)]' : '',
        ].join(' ')}
      >
        {icon && (
          <span
            className={[
              'shrink-0',
              checked ? '[color:var(--section-card-label-active)] opacity-80' : 'text-(--text-disabled)',
            ].join(' ')}
          >
            {icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p
            className={[
              'text-caption font-semibold uppercase tracking-wide',
              checked ? '[color:var(--section-card-label-active)]' : '[color:var(--section-card-label)]',
            ].join(' ')}
          >
            {label}
          </p>
          {(checked ? summary : description) && (
            <p
              className={[
                'text-caption leading-snug mt-0.5 truncate',
                checked ? '[color:var(--section-card-badge-active)]' : '[color:var(--section-card-badge)]',
              ].join(' ')}
            >
              {checked ? summary : description}
            </p>
          )}
        </div>
        {checked && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={editLabel}
            className="shrink-0 [color:var(--section-card-label-active)] opacity-70 hover:opacity-100 transition-opacity p-1 -m-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <Pencil size={14} />
          </button>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          onClick={() => onCheckedChange?.(!checked)}
          className={[
            'relative inline-flex shrink-0 h-5 w-9 rounded-full transition-colors focus:outline-none focus-visible:ring-2',
            checked
              ? 'bg-(--surface-default)/30 focus-visible:ring-white/40'
              : 'bg-(--surface-raised) border border-stroke-default focus-visible:ring-stroke-focus/30',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 inline-block h-4 w-4 rounded-full bg-(--surface-default) shadow-sm transition-transform',
              checked ? 'translate-x-[18px]' : 'translate-x-0.5',
            ].join(' ')}
          />
        </button>
      </div>
    </div>
  );
}
