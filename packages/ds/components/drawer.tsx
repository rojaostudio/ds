'use client';

import { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from './use-focus-trap';

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface DrawerProps {
  open:       boolean;
  onClose:    () => void;
  title?:     React.ReactNode;
  /** Subtítulo opcional abaixo do title. */
  subtitle?:  React.ReactNode;
  children:   React.ReactNode;
  footer?:    React.ReactNode;
  side?:      'left' | 'right';
  /** Tamanho preset. Sobrescreve `width` se ambos passados. */
  size?:      DrawerSize;
  /** Largura custom (Tailwind class, ex: "w-96"). Use só se size não atende. */
  width?:     string;
  closeOnBackdrop?: boolean;
  hideClose?: boolean;
  className?: string;
  /** Alvo do portal. default = document.body. Passe um elemento de um subtree TEMATIZADO (ex.: a
   *  raiz do tema da loja) pra o drawer herdar tokens/mode/fonte daquele contexto em vez do global. */
  container?: Element | null;
}

const SIZE_WIDTH: Record<DrawerSize, string> = {
  sm: 'w-80',           // 320px
  md: 'w-96',           // 384px
  lg: 'w-[480px]',
  xl: 'w-[640px]',
};

export function Drawer({
  open, onClose, title, subtitle, children, footer,
  side = 'right',
  size,
  width,
  closeOnBackdrop = true,
  hideClose = false,
  className = '',
  container,
}: DrawerProps) {
  const widthClass = width ?? SIZE_WIDTH[size ?? 'md'];
  const titleId = useId();
  const panelRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 [background:var(--overlay-scrim)]" onClick={closeOnBackdrop ? onClose : undefined} aria-hidden="true" />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={[
          'relative z-10 flex flex-col bg-surface-default shadow-xl h-full max-w-full',
          'focus:outline-none',
          widthClass,
          side === 'right' ? 'ml-auto' : 'mr-auto',
          className,
        ].join(' ')}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-stroke-default shrink-0">
            <div className="flex-1 min-w-0">
              {title && <h2 id={titleId} className="text-body font-semibold text-fg-primary">{title}</h2>}
              {subtitle && <p className="text-label text-fg-muted mt-0.5">{subtitle}</p>}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 text-fg-muted hover:text-fg-primary transition-colors rounded focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:outline-none p-0.5"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            )}
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
