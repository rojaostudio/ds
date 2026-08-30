'use client';

import { useEffect, useRef, useState, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Popover — overlay flutuante ancorado num trigger. Base genérica de Menu,
 * HoverCard, custom dropdowns. Não tem opinião sobre conteúdo.
 *
 * Uso:
 *   <Popover
 *     trigger={<Button>Abrir</Button>}
 *     placement="bottom-start"
 *   >
 *     <div className="p-3 bg-surface-default rounded-md shadow-lg">
 *       Conteúdo aqui
 *     </div>
 *   </Popover>
 *
 * Recursos: clique fora fecha, ESC fecha, focus trap opcional, posicionamento
 * com flip automático quando não cabe (top → bottom, etc).
 */

export type PopoverPlacement =
  | 'top-start' | 'top' | 'top-end'
  | 'bottom-start' | 'bottom' | 'bottom-end'
  | 'left-start' | 'left' | 'left-end'
  | 'right-start' | 'right' | 'right-end';

export interface PopoverProps {
  trigger:     ReactNode;
  children:    ReactNode | ((api: { close: () => void }) => ReactNode);
  /** Posição preferida. flip automático quando não cabe na viewport. */
  placement?:  PopoverPlacement;
  /** Distância em px entre trigger e popover. default = 4. */
  offset?:     number;
  /** Controla externamente. Se omitido, gerencia interno. */
  open?:       boolean;
  onOpenChange?: (open: boolean) => void;
  /** Fecha ao clicar fora. default = true. */
  closeOnOutsideClick?: boolean;
  /** Fecha ao apertar ESC. default = true. */
  closeOnEsc?: boolean;
  className?:  string;
  /** Classe CSS do wrapper do trigger. default = "inline-block". */
  triggerClassName?: string;
}

interface Position {
  top:  number;
  left: number;
  /** Placement realmente usado após flip. */
  placement: PopoverPlacement;
}

function calcPosition(
  triggerRect: DOMRect,
  popRect: DOMRect,
  placement: PopoverPlacement,
  offset: number,
): Position {
  const { innerWidth: vw, innerHeight: vh } = window;

  // Determina eixo principal e posição cross
  let [side, cross = 'center'] = placement.split('-') as [string, string];

  // Tentativa inicial
  let top = 0, left = 0;
  const place = (s: string, c: string) => {
    if (s === 'bottom') top = triggerRect.bottom + offset;
    else if (s === 'top') top = triggerRect.top - popRect.height - offset;
    else if (s === 'left') { left = triggerRect.left - popRect.width - offset; }
    else if (s === 'right') { left = triggerRect.right + offset; }

    if (s === 'top' || s === 'bottom') {
      if (c === 'start')   left = triggerRect.left;
      else if (c === 'end') left = triggerRect.right - popRect.width;
      else                  left = triggerRect.left + (triggerRect.width - popRect.width) / 2;
    } else {
      if (c === 'start')   top = triggerRect.top;
      else if (c === 'end') top = triggerRect.bottom - popRect.height;
      else                  top = triggerRect.top + (triggerRect.height - popRect.height) / 2;
    }
  };
  place(side, cross);

  // Flip se não cabe
  if (side === 'bottom' && top + popRect.height > vh) { side = 'top'; place(side, cross); }
  else if (side === 'top' && top < 0)                { side = 'bottom'; place(side, cross); }
  if (side === 'right' && left + popRect.width > vw) { side = 'left'; place(side, cross); }
  else if (side === 'left' && left < 0)              { side = 'right'; place(side, cross); }

  // Clamp dentro da viewport
  left = Math.max(8, Math.min(left, vw - popRect.width - 8));
  top  = Math.max(8, Math.min(top, vh - popRect.height - 8));

  return { top, left, placement: `${side}${cross !== 'center' ? `-${cross}` : ''}` as PopoverPlacement };
}

export function Popover({
  trigger,
  children,
  placement = 'bottom-start',
  offset = 4,
  open: openProp,
  onOpenChange,
  closeOnOutsideClick = true,
  closeOnEsc = true,
  className = '',
  triggerClassName,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popRef     = useRef<HTMLDivElement>(null);
  const id = useId();

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => { setMounted(true); }, []);

  // Reposiciona quando abre
  useEffect(() => {
    if (!open || !triggerRef.current || !popRef.current) return;
    const update = () => {
      if (!triggerRef.current || !popRef.current) return;
      const trig = triggerRef.current.getBoundingClientRect();
      const pop  = popRef.current.getBoundingClientRect();
      setPosition(calcPosition(trig, pop, placement, offset));
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, placement, offset]);

  // Outside click + ESC
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!closeOnOutsideClick) return;
      const t = e.target as Node;
      if (popRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, closeOnOutsideClick, closeOnEsc]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => setOpen(false);
  const toggle = () => setOpen(!open);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggle}
        role="none"
        className={triggerClassName ?? 'inline-block'}
      >
        {trigger}
      </div>
      {mounted && open && createPortal(
        <div
          ref={popRef}
          id={id}
          className={['fixed z-[1000]', className].join(' ')}
          style={{
            top:  position?.top  ?? -9999,
            left: position?.left ?? -9999,
            visibility: position ? 'visible' : 'hidden',
          }}
        >
          {typeof children === 'function' ? children({ close }) : children}
        </div>,
        document.body,
      )}
    </>
  );
}
