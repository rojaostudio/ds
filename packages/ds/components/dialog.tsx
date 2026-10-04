'use client';

import { ModalClose, ModalShell, type ModalProps } from './internal/modal';

export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogProps extends ModalProps {
  /**
   * sm 400 (a question with one field), md 560 (a short form, the default), lg 720 (a table or a preview) (Figma:
   * `size`).
   */
  size?: DialogSize;
}

/**
 * Dialog — Figma [RDS] Overlays/Dialog. A window over the screen for a short task: create, edit (Radix Dialog).
 * role="dialog", aria-modal, named by the title and described by the description; the focus opens on the first
 * control of the content, stays inside (Tab cycles) and goes back to what opened it. Escape, the × and a click on
 * the veil close it, and the page behind doesn't scroll. Something with no way back is the AlertDialog; a long
 * form is the Sheet. Styles: internal/modal.css and dialog.css.
 */
export function Dialog({ size = 'md', ...props }: DialogProps) {
  return <ModalShell prefix="rds-dialog" modifiers={[`rds-dialog--${size}`]} {...props} />;
}

/** Wraps an element inside the Dialog that closes it when pressed, with asChild. */
export const DialogClose = ModalClose;
