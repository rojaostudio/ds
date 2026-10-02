'use client';

import { useRef, useState } from 'react';
import { ModalClose, ModalShell, type ModalProps } from './internal/modal';

export type DrawerProps = ModalProps;

/** How far down (px) the handle has to be dragged to close. */
const DISMISS_DISTANCE = 80;

/**
 * Drawer — Figma [RDS] Overlays/Drawer. The panel that comes up from the bottom, on a phone: filters, quick
 * choices (Radix Dialog). role="dialog", aria-modal, named by the title; the focus stays inside and goes back to
 * what opened it, and the page behind doesn't scroll. It has no ×: dragging the handle down, a tap on the veil,
 * Escape or Cancel close it. The default footer is stacked, the main action first and full width.
 * In 1.x this was the BottomSheet; the 1.x Drawer (from the side) is now the Sheet.
 * Styles: internal/modal.css and drawer.css.
 */
export function Drawer({ open, defaultOpen, onOpenChange, ...props }: DrawerProps) {
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

  // The handle is for the pointer only: the keyboard closes with Escape or Cancel.
  const handle = (
    <div
      className="rds-drawer__handle-area"
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
      <span className="rds-drawer__handle" />
    </div>
  );

  return (
    <ModalShell
      prefix="rds-drawer"
      closeButton={false}
      stackedFooter
      handle={handle}
      open={isOpen}
      onOpenChange={setOpen}
      boxStyle={drag ? { transform: `translateY(${drag}px)`, animation: 'none' } : undefined}
      {...props}
    />
  );
}

/** Wraps an element inside the Drawer that closes it when pressed, with asChild. */
export const DrawerClose = ModalClose;
