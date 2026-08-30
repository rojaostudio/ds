'use client';

import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export interface SavingBarProps {
  visible: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  pending?: boolean;
  saveLabel?: string;
  discardLabel?: string;
  message?: string;
  children?: ReactNode;
  /** floating = fixed bottom-right; inline = inside page flow */
  variant?: 'floating' | 'inline';
}

export function SavingBar({
  visible,
  onSave,
  onDiscard,
  pending = false,
  saveLabel = 'Salvar',
  discardLabel = 'Descartar',
  message,
  children,
  variant = 'floating',
}: SavingBarProps) {
  const pill = (
    <div
      className={[
        'flex items-center gap-3 rounded-(--radius-card) px-4 py-3',
        '[background:var(--saving-bar-bg)]',
        variant === 'floating' ? '[box-shadow:var(--saving-bar-shadow)]' : '',
      ].filter(Boolean).join(' ')}
    >
      {message && (
        <span className="text-label pr-1 [color:var(--saving-bar-message)]">{message}</span>
      )}
      {children}
      {onDiscard && (
        <button
          type="button"
          onClick={onDiscard}
          disabled={pending}
          className="rounded-(--radius-card) border px-3 py-1.5 text-label font-medium transition-colors disabled:opacity-40 [border-color:var(--saving-bar-discard-border)] [color:var(--saving-bar-discard-text)] hover:[border-color:var(--saving-bar-discard-border-hover)] hover:[color:var(--saving-bar-discard-text-hover)]"
        >
          {discardLabel}
        </button>
      )}
      {onSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="rounded-(--radius-card) px-4 py-1.5 text-label font-medium transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[80px] justify-center [background:var(--saving-bar-save-bg)] [color:var(--saving-bar-save-text)] hover:[background:var(--saving-bar-save-bg-hover)]"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : saveLabel}
        </button>
      )}
    </div>
  );

  if (variant === 'inline') {
    return (
      <div
        className={[
          'flex justify-end mt-8 transition-all duration-300 ease-out',
          visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      >
        {pill}
      </div>
    );
  }

  return (
    <div
      className={[
        'fixed bottom-3 right-6 z-50 transition-all duration-300 ease-out',
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-4 opacity-0 pointer-events-none',
      ].join(' ')}
    >
      {pill}
    </div>
  );
}
