'use client';

import type { CSSProperties, ReactNode } from 'react';
import { ModalClose, ModalShell, type ModalProps } from './internal/modal';
import { useDragDismiss } from './internal/use-drag-dismiss';
import { useKeyboardInset } from './internal/use-on-screen-keyboard';

export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogProps extends ModalProps {
  /**
   * sm 400 (a question with one field), md 560 (a short form, the default), lg 720 (a table or a preview) (Figma:
   * `size`). On a compact screen every size is the sheet: the screen's width, up to 560.
   */
  size?: DialogSize;
  /**
   * Something that goes with the action, fixed at the start of the footer, before the buttons (a live total: "1.000 un
   * × R$ 0,18 · R$ 180,00") (Figma: `showFooterStart` + the `footerStart` slot). It doesn't scroll with the content.
   * When the buttons don't fit beside it (sm, and always on the compact sheet) it goes above them.
   */
  footerStart?: ReactNode;
}

/**
 * Dialog — Figma [RDS] Overlays/Dialog. A window over the screen for a short task: create, edit (Radix Dialog).
 * role="dialog", aria-modal, named by the title and described by the description; the focus opens on the first
 * control of the content, stays inside (Tab cycles) and goes back to what opened it. Escape, the × and a click on
 * the veil close it, and the page behind doesn't scroll. Something with no way back is the AlertDialog; a long
 * form is the Sheet.
 * On a compact screen (below 1024; Figma: the viewport mode, layout/compact) the same Dialog is a sheet stuck to the
 * bottom: the handle on top (dragging it down closes), up to 85% of the screen with only the content scrolling, the
 * default Cancel gone (the handle, the veil, Escape and the × close it) and the main action full width; it rises
 * above the on-screen keyboard and clears the safe area. A custom `footer` stacks full width, the last (the main
 * action) on top. Styles: internal/modal.css and dialog.css.
 */
export function Dialog({ size = 'md', open, defaultOpen, onOpenChange, ...props }: DialogProps) {
  const sheet = useDragDismiss({ open, defaultOpen, onOpenChange });
  const keyboard = useKeyboardInset(sheet.isOpen);
  const style = keyboard ? ({ ...sheet.boxStyle, '--_kb': `${keyboard}px` } as CSSProperties) : sheet.boxStyle;
  return (
    <ModalShell
      prefix="rds-dialog"
      modifiers={[`rds-dialog--${size}`]}
      handle={sheet.handle}
      open={sheet.isOpen}
      onOpenChange={sheet.setOpen}
      boxStyle={style}
      {...props}
    />
  );
}

/** Wraps an element inside the Dialog that closes it when pressed, with asChild. */
export const DialogClose = ModalClose;
