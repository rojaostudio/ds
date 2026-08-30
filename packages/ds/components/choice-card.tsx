'use client';

import type { ReactNode } from 'react';

export interface ChoiceCardProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** Override pontual (ex.: rounded-b-none quando há painel anexado embaixo). */
  className?: string;
}

export function ChoiceCard({ selected, onClick, label, description, icon, disabled = false, className = '' }: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'w-full flex items-center gap-4 px-4 py-4 rounded-(--radius-card) border text-left transition-all',
        selected
          ? '[border-color:var(--choice-card-border-active)] [background:var(--choice-card-bg-active)]'
          : '[border-color:var(--choice-card-border)] [background:var(--choice-card-bg)] hover:[border-color:var(--choice-card-border-hover)]',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {icon && (
        <div
          className={[
            'shrink-0 w-9 h-9 rounded-(--radius-card) flex items-center justify-center transition-colors',
            selected
              ? '[background:var(--choice-card-icon-bg-active)] [color:var(--choice-card-icon-active)]'
              : '[background:var(--choice-card-icon-bg)] [color:var(--choice-card-icon)]',
          ].join(' ')}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p
          className={[
            'text-label font-semibold',
            selected ? '[color:var(--choice-card-label-active)]' : '[color:var(--choice-card-label)]',
          ].join(' ')}
        >
          {label}
        </p>
        {description && (
          <p
            className={[
              'text-caption mt-0.5',
              selected ? '[color:var(--choice-card-description-active)]' : '[color:var(--choice-card-description)]',
            ].join(' ')}
          >
            {description}
          </p>
        )}
      </div>
      {/* Radio indicator */}
      <div
        className={[
          'shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
          selected ? '[border-color:var(--choice-card-radio-border-active)]' : '[border-color:var(--choice-card-radio-border)]',
        ].join(' ')}
      >
        {selected && (
          <div className="w-2 h-2 rounded-full [background:var(--choice-card-radio-dot)]" />
        )}
      </div>
    </button>
  );
}
