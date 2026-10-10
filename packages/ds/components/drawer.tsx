'use client';

import { ModalClose, ModalShell, type ModalProps } from './internal/modal';
import { useDragDismiss } from './internal/use-drag-dismiss';

export type DrawerProps = ModalProps;

/**
 * Drawer — Figma [RDS] Overlays/Drawer. The panel that comes up from the bottom, on a phone: filters, quick
 * choices (Radix Dialog). role="dialog", aria-modal, named by the title; the focus stays inside and goes back to
 * what opened it, and the page behind doesn't scroll. It has no ×: dragging the handle down, a tap on the veil,
 * Escape or Cancel close it. The default footer is stacked, the main action first and full width.
 * In 1.x this was the BottomSheet; the 1.x Drawer (from the side) is now the Sheet.
 * Styles: internal/modal.css and drawer.css.
 */
export function Drawer({ open, defaultOpen, onOpenChange, ...props }: DrawerProps) {
  const sheet = useDragDismiss({ open, defaultOpen, onOpenChange });
  return (
    <ModalShell
      prefix="rds-drawer"
      closeButton={false}
      stackedFooter
      handle={sheet.handle}
      open={sheet.isOpen}
      onOpenChange={sheet.setOpen}
      boxStyle={sheet.boxStyle}
      {...props}
    />
  );
}

/** Wraps an element inside the Drawer that closes it when pressed, with asChild. */
export const DrawerClose = ModalClose;
