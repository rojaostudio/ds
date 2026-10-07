'use client';

import { useRef, useState, type CSSProperties, type ReactNode } from 'react';

/** How far down (px) the handle has to be dragged to close. */
const DISMISS_DISTANCE = 80;

interface DragDismissOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * The sheet's handle (Drawer, and the Dialog on a compact screen): dragged down past 80 it closes; short of that the
 * box goes back. It owns the open state when uncontrolled, so the drag can close it. The handle is for the pointer
 * only (aria-hidden): the keyboard closes with Escape, the × or Cancel. Where it shows is up to each stylesheet.
 */
export function useDragDismiss({ open, defaultOpen, onOpenChange }: DragDismissOptions) {
  const [own, setOwn] = useState(defaultOpen ?? false);
  const isOpen = open ?? own;
  const setOpen = (next: boolean) => {
    setOwn(next);
    onOpenChange?.(next);
  };
  const start = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);
  const reset = () => {
    start.current = null;
    setDrag(0);
  };

  const handle: ReactNode = (
    <div
      className="rds-modal__handle-area"
      aria-hidden="true"
      onPointerDown={(event) => {
        start.current = event.clientY;
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (start.current !== null) setDrag(Math.max(0, event.clientY - start.current));
      }}
      onPointerUp={(event) => {
        if (start.current !== null && event.clientY - start.current > DISMISS_DISTANCE) setOpen(false);
        reset();
      }}
      onPointerCancel={reset}
    >
      <span className="rds-modal__handle" />
    </div>
  );

  const boxStyle: CSSProperties | undefined = drag
    ? { transform: `translateY(${drag}px)`, animation: 'none', transition: 'none' }
    : undefined;

  return { isOpen, setOpen, handle, boxStyle };
}
