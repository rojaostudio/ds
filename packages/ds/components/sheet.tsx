'use client';

import { ModalClose, ModalShell, type ModalProps } from './internal/modal';

export type SheetSide = 'right' | 'left';

export interface SheetProps extends ModalProps {
  /** right for details and filters; left for navigation (Figma: `side`). */
  side?: SheetSide;
}

/**
 * Sheet — Figma [RDS] Overlays/Sheet. A panel that comes in from the side, over the screen (Radix Dialog):
 * filters, an item's details, a long form. role="dialog", aria-modal, named by the title; the focus stays inside
 * and goes back to what opened it. Escape, the × and a click on the veil close it, and the page behind doesn't
 * scroll. In 1.x this was the Drawer: the Drawer is now the one that comes up from the bottom.
 * Styles: internal/modal.css and sheet.css.
 */
export function Sheet({ side = 'right', ...props }: SheetProps) {
  return <ModalShell prefix="rds-sheet" modifiers={[`rds-sheet--${side}`]} {...props} />;
}

/** Wraps an element inside the Sheet that closes it when pressed, with asChild. */
export const SheetClose = ModalClose;
