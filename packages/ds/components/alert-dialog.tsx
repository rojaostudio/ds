'use client';

import type { ReactElement, ReactNode } from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { Button } from './button';

export type AlertDialogTone = 'danger' | 'action';

export interface AlertDialogProps {
  /** The element that opens it (a Button). Leave it out to control it with `open`. */
  trigger?: ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The question, with its object (Figma: `title`): "Excluir a lista Clientes?". */
  title: ReactNode;
  /** The consequence, including that it can't be undone (Figma: `description`). */
  description: ReactNode;
  /** danger when the action deletes or loses something; action when it only can't be taken back. */
  tone?: AlertDialogTone;
  /** The confirm button repeats the title's verb ("Excluir lista"), never a bare "Sim" or "OK". */
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel?: string;
  /** The veil over the page (Figma: `showScrim`). */
  showScrim?: boolean;
}

/**
 * AlertDialog — Figma [RDS] Feedback/AlertDialog. A question that interrupts before an action with no way back
 * (Radix AlertDialog): role="alertdialog", the focus opens on Cancel and stays inside until it closes, then goes
 * back to what opened it. The decision is required: no ×, and neither Escape nor a click outside closes it, only
 * Cancel or the action (house rule; Figma 09/10). Styles: alert-dialog.css.
 */
export function AlertDialog({
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  tone = 'danger',
  confirmLabel,
  onConfirm,
  cancelLabel = 'Cancelar',
  showScrim = true,
}: AlertDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogPrimitive.Trigger asChild>{trigger}</AlertDialogPrimitive.Trigger>}
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className={showScrim ? 'rds-alert-dialog__scrim' : 'rds-alert-dialog__scrim rds-alert-dialog__scrim--clear'}
        />
        <AlertDialogPrimitive.Content className="rds-alert-dialog" onEscapeKeyDown={(event) => event.preventDefault()}>
          <div className="rds-alert-dialog__content">
            <AlertDialogPrimitive.Title className="rds-alert-dialog__title">{title}</AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="rds-alert-dialog__description">
              {description}
            </AlertDialogPrimitive.Description>
          </div>
          <div className="rds-alert-dialog__footer">
            <AlertDialogPrimitive.Cancel asChild>
              <Button tone="neutral" variant="outline">
                {cancelLabel}
              </Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button tone={tone} variant="fill" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
