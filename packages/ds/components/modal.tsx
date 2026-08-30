'use client';

import { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from './use-focus-trap';

export interface ModalProps {
  open:       boolean;
  onClose:    () => void;
  title?:     React.ReactNode;
  /** Subtítulo opcional abaixo do title. */
  subtitle?:  React.ReactNode;
  children:   React.ReactNode;
  footer?:    React.ReactNode;
  /** Ação no canto direito do header (ex.: link ghost), renderizada antes do X. */
  headerAction?: React.ReactNode;
  size?:      'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Fecha ao clicar no backdrop. default = true. */
  closeOnBackdrop?: boolean;
  /** Esconde o botão X do header. default = false. */
  hideClose?: boolean;
  className?: string;
  /** Alvo do portal. default = document.body. Passe um elemento de um subtree TEMATIZADO (ex.: a
   *  raiz do tema da loja) pra o modal herdar tokens/mode/fonte daquele contexto em vez do global. */
  container?: Element | null;
}

const sizes = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)]',
};

export function Modal({ open, onClose, title, subtitle, children, footer, headerAction, size = 'md', closeOnBackdrop = true, hideClose = false, className = '', container }: ModalProps) {
  const titleId = useId();
  const dialogRef = useFocusTrap<HTMLDivElement>(open);

  // Portal montado só no cliente. No SSR e no primeiro paint do cliente
  // retornamos null — assim server e client-first-render batem (sem hydration
  // mismatch) mesmo quando open=true já no carregamento (ex: open derivado de
  // searchParam). O portal aparece no tick seguinte, pós-mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — fixed so parent padding never clips it */}
      <div className="fixed inset-0 [background:var(--overlay-scrim)]" onClick={closeOnBackdrop ? onClose : undefined} aria-hidden="true" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={[
          'relative z-10 w-full rounded-(--radius-card) bg-surface-default shadow-xl',
          'flex flex-col max-h-[90dvh]',
          'focus:outline-none',
          sizes[size],
          className,
        ].join(' ')}
      >
        {(title || headerAction || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-stroke-default shrink-0">
            <div className="flex-1 min-w-0">
              {title && <h2 id={titleId} className="text-body font-semibold text-fg-primary">{title}</h2>}
              {subtitle && <p className="text-label text-fg-muted mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {headerAction}
              {!hideClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-fg-muted hover:text-fg-primary transition-colors rounded focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:outline-none p-0.5"
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stroke-default shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    container ?? document.body
  );
}
