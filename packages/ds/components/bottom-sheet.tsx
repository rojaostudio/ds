'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from './use-focus-trap';

/**
 * BottomSheet — drawer ancorado na borda inferior. Padrão mobile-first;
 * em desktop renderiza centralizado mais estreito (responde ao viewport).
 *
 * Uso:
 *   <BottomSheet open={open} onClose={() => setOpen(false)} title="Filtros">
 *     <p>Conteúdo</p>
 *   </BottomSheet>
 *
 * Recursos: backdrop com fade, swipe-to-dismiss (em mobile), trap focus básico,
 * ESC fecha, snap points opcionais (full / half / auto).
 */

export interface BottomSheetProps {
  open:        boolean;
  onClose:     () => void;
  title?:      string;
  children:    ReactNode;
  /** Altura do sheet. default = "auto" (cresce até max-h). */
  snap?:       'auto' | 'half' | 'full';
  /** Esconde header + close button. default = false. */
  hideHeader?: boolean;
  /** Fecha ao clicar no backdrop. default = true. */
  closeOnBackdrop?: boolean;
  className?:  string;
}

const SNAP_HEIGHT = {
  auto: 'max-h-[90dvh]',
  half: 'h-1/2',
  full: 'h-[95dvh]',
} as const;

export const BottomSheet = forwardRef<HTMLDivElement, BottomSheetProps>(function BottomSheet({
  open,
  onClose,
  title,
  children,
  snap = 'auto',
  hideHeader = false,
  closeOnBackdrop = true,
  className = '',
}: BottomSheetProps, ref) {
  const [mounted, setMounted] = useState(false);
  // Same trap as Modal: initial focus, Tab cycling, restore to trigger on close.
  const sheetRef = useFocusTrap<HTMLDivElement>(open);
  useImperativeHandle(ref, () => sheetRef.current!);
  const dragStartY = useRef(0);

  const handleDragStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0]?.clientY ?? 0;
  };

  const handleDragMove = (e: React.TouchEvent) => {
    const container = sheetRef.current?.querySelector('[data-scroll-container]');
    if (container && (container as HTMLElement).scrollTop > 0) return;
    const y = e.touches[0]?.clientY;
    if (y !== undefined && y - dragStartY.current > 80) onClose();
  };

  useEffect(() => { setMounted(true); }, []);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      className="fixed inset-0 z-[1000] flex items-end justify-center"
    >
      {/* Backdrop */}
      <div
        data-bottom-sheet-backdrop
        onClick={closeOnBackdrop ? onClose : undefined}
        className="absolute inset-0 [background:var(--overlay-scrim)] rojao-bottom-sheet--backdrop-enter"
        aria-hidden
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        tabIndex={-1}
        className={[
          'relative w-full sm:max-w-md bg-surface-default rounded-t-(--radius-toast) shadow-2xl outline-none',
          'flex flex-col rojao-bottom-sheet--enter',
          SNAP_HEIGHT[snap],
          className,
        ].join(' ')}
      >
        {/* Drag handle compacto — o swipe-to-dismiss também vale no header,
            então a área de toque continua generosa sem sobrar espaço vazio */}
        <div
          data-drag-handle
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          className="flex justify-center items-center min-h-[20px] pt-2 shrink-0 touch-none cursor-grab"
        >
          <span className="w-10 h-1 rounded-full bg-(--border-strong)" aria-hidden />
        </div>

        {!hideHeader && (
          <div
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-stroke-default shrink-0"
          >
            <h2 id="bottom-sheet-title" className="text-body font-semibold text-fg-primary">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="text-fg-muted hover:text-fg-primary transition-colors p-3 -mr-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div data-scroll-container className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
});
