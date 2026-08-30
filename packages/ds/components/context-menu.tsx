'use client';

import { forwardRef, useState, useEffect, useRef, useImperativeHandle, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * ContextMenu — menu acionado por clique direito (contextmenu event).
 *
 * Uso:
 *   <ContextMenu menu={({ close }) => (
 *     <>
 *       <MenuItem onClick={() => { copy(); close(); }}>Copiar</MenuItem>
 *       <MenuItem onClick={() => { paste(); close(); }}>Colar</MenuItem>
 *     </>
 *   )}>
 *     <div className="border p-4">Clique direito aqui</div>
 *   </ContextMenu>
 *
 * Posiciona no ponto exato do clique. Fecha em ESC, clique fora, scroll.
 */

export interface ContextMenuProps {
  children: ReactNode;
  /** Conteúdo do menu (mesmo formato do Menu — MenuItem, MenuSeparator, etc). */
  menu:     ReactNode | ((api: { close: () => void }) => ReactNode);
  /** Largura mínima em px. default = 180. */
  minWidth?: number;
  /** Desabilita o context menu. default = false. */
  disabled?: boolean;
  className?: string;
}

interface Position { x: number; y: number; }

export const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(function ContextMenu({
  children,
  menu,
  minWidth = 180,
  disabled = false,
  className = '',
}: ContextMenuProps, ref) {
  const [pos, setPos] = useState<Position | null>(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => containerRef.current!);

  useEffect(() => { setMounted(true); }, []);

  // Fecha em outside click, ESC, scroll
  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      close();
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('scroll', close, true);
    };
  }, [pos]);

  // Reposiciona pra caber na viewport (depois de montar pra ler getBoundingClientRect)
  useEffect(() => {
    if (!pos || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const { innerWidth: vw, innerHeight: vh } = window;
    let { x, y } = pos;
    if (x + rect.width > vw - 8)  x = vw - rect.width - 8;
    if (y + rect.height > vh - 8) y = vh - rect.height - 8;
    if (x !== pos.x || y !== pos.y) setPos({ x, y });
  }, [pos]);

  function handleContext(e: React.MouseEvent) {
    if (disabled) return;
    e.preventDefault();
    setPos({ x: e.clientX, y: e.clientY });
  }

  return (
    <>
      <div ref={containerRef} onContextMenu={handleContext} className={className}>
        {children}
      </div>
      {mounted && pos && createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[1000] rounded-(--radius-card) border border-stroke-default bg-surface-default shadow-lg py-1"
          style={{ top: pos.y, left: pos.x, minWidth }}
        >
          {typeof menu === 'function' ? menu({ close: () => setPos(null) }) : menu}
        </div>,
        document.body,
      )}
    </>
  );
});
