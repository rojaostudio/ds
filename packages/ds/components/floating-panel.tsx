'use client';

import { useId, useRef, type ReactElement, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { IconButton } from './icon-button';
import { ChevronLeftIcon, CloseIcon } from './internal/icons';
import { Tooltip } from './tooltip';

export interface FloatingPanelProps {
  /** The element that opens it. Leave it out to control it with `open` (the FAB the product owns). */
  trigger?: ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Who or what the window is (Figma: `title`). It names the window for screen readers. */
  title: ReactNode;
  /** A line under the title, such as "Online agora" (Figma: `showStatus` + `status`). */
  status?: ReactNode;
  /** An Avatar or the brand mark before the title (Figma: `showAvatar`). Decorative: the title names it. */
  avatar?: ReactNode;
  /** The body, the only part that scrolls (Figma: slot `body`): a conversation, a help article. */
  children?: ReactNode;
  /** Fixed at the foot (Figma: `showFooter` + slot `footer`): usually a Composer. */
  footer?: ReactNode;
  /** The close button's name (and its Tooltip). */
  closeLabel?: string;
  /** The back button's name, on a compact screen, where the window fills it. */
  backLabel?: string;
  /** Where the layer is portaled (default document.body): a themed subtree keeps its theme. */
  container?: HTMLElement | null;
  className?: string;
}

/**
 * FloatingPanel — Figma [RDS] Overlays/FloatingPanel (ds#180). A window over the page that does not block it: a support
 * chat, help, an assistant. The page goes on working while it is open: no veil, the focus is not trapped and a click
 * outside does not close it; Esc and the close button do, and the focus goes back to what opened it.
 *
 * From lg it floats at the bottom right, 24 from the edges: 400 wide (layout/floating-panel/width = layout/surface/md),
 * 640 tall and never over the screen height minus 96. On a compact screen (below lg) it fills the screen, without a
 * radius, and a back button takes the close's place. Only the body scrolls. Styles: floating-panel.css.
 *
 * To confirm or ask something that stops the flow, use the Dialog; for a panel fixed to a side, the Sheet or Drawer.
 */
export function FloatingPanel({
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  title,
  status,
  avatar,
  children,
  footer,
  closeLabel = 'Fechar',
  backLabel = 'Voltar',
  container,
  className,
}: FloatingPanelProps) {
  const opener = useRef<HTMLElement | null>(null);
  const statusId = `${useId()}-status`;
  return (
    <DialogPrimitive.Root modal={false} open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Content
          aria-modal="false"
          aria-describedby={status ? statusId : undefined}
          className={['rds-floating-panel', className].filter(Boolean).join(' ')}
          // A click on the page keeps it open: it floats beside the work, it does not interrupt it.
          onInteractOutside={(event) => event.preventDefault()}
          onOpenAutoFocus={(event) => {
            opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            // Straight to writing when there is a field at the foot; otherwise the panel itself.
            const box = event.currentTarget as HTMLElement;
            event.preventDefault();
            (box.querySelector<HTMLElement>('.rds-floating-panel__footer :is(textarea, input):not(:disabled)') ?? box).focus();
          }}
          onCloseAutoFocus={(event) => {
            if (trigger || !opener.current?.isConnected) return;
            event.preventDefault();
            opener.current.focus();
          }}
        >
          <div className="rds-floating-panel__header">
            <Tooltip text={backLabel}>
              <DialogPrimitive.Close asChild>
                <IconButton
                  icon={<ChevronLeftIcon />}
                  label={backLabel}
                  tone="neutral"
                  variant="ghost"
                  className="rds-floating-panel__back"
                />
              </DialogPrimitive.Close>
            </Tooltip>
            {avatar && (
              <div className="rds-floating-panel__avatar" aria-hidden="true">
                {avatar}
              </div>
            )}
            <div className="rds-floating-panel__heading">
              <DialogPrimitive.Title className="rds-floating-panel__title">{title}</DialogPrimitive.Title>
              {status && (
                <p id={statusId} className="rds-floating-panel__status">
                  {status}
                </p>
              )}
            </div>
            <Tooltip text={closeLabel}>
              <DialogPrimitive.Close asChild>
                <IconButton
                  icon={<CloseIcon />}
                  label={closeLabel}
                  tone="neutral"
                  variant="ghost"
                  className="rds-floating-panel__close"
                />
              </DialogPrimitive.Close>
            </Tooltip>
          </div>
          {/* It scrolls, so the keyboard reaches it (arrows and Page Down read a long conversation). */}
          <div className="rds-floating-panel__body" tabIndex={0}>
            {children}
          </div>
          {footer && <div className="rds-floating-panel__footer">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
