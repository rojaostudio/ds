'use client';

// The parts shared by Dialog, Sheet and Drawer (Radix Dialog): the veil, the box, the header (title, description
// and the close IconButton), the content and the footer. Each component gives the box its place (centre, side,
// bottom) and its colours in its own stylesheet. Not exported from the package.
import { useRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '../button';
import { IconButton } from '../icon-button';
import { Tooltip } from '../tooltip';
import { CloseIcon } from './icons';

export interface ModalProps {
  /** The element that opens it (a Button). Leave it out to control it with `open`. */
  trigger?: ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The task or the subject (Figma: `title`). It names the window for screen readers. */
  title: ReactNode;
  /** The context under the title (Figma: `showDescription` + `description`). */
  description?: ReactNode;
  /** The content (Figma: the `content` slot). */
  children?: ReactNode;
  /**
   * The footer (Figma: `showFooter` + the footer). Leave it out and give `confirmLabel` for the default
   * Cancel + confirm pair; leave both out for no footer.
   */
  footer?: ReactNode;
  /** The main action's verb ("Criar público"). With it, the default footer shows. */
  confirmLabel?: string;
  /** Runs on the confirm button. It does not close: close it with `open`, or put a `*Close` in `footer`. */
  onConfirm?: () => void;
  cancelLabel?: string;
  /** The veil over the page (Figma: `showScrim`). Without it the page still can't be clicked. */
  showScrim?: boolean;
  /** The close button's name for screen readers. */
  closeLabel?: string;
  /** Where the layer is portaled (default document.body): a themed subtree keeps its theme. */
  container?: HTMLElement | null;
  className?: string;
}

interface ModalShellProps extends ModalProps {
  /** The component's class (rds-dialog, rds-sheet, rds-drawer), also the prefix of its parts. */
  prefix: string;
  modifiers?: string[];
  closeButton?: boolean;
  /** Something above the header (the Drawer's handle). */
  handle?: ReactNode;
  /** The default footer stacked, the confirm first and full width (the Drawer). */
  stackedFooter?: boolean;
  boxStyle?: CSSProperties;
}

export function ModalShell({
  prefix,
  modifiers = [],
  closeButton = true,
  handle,
  stackedFooter,
  boxStyle,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  confirmLabel,
  onConfirm,
  cancelLabel = 'Cancelar',
  showScrim = true,
  closeLabel = 'Fechar',
  container,
  className,
}: ModalShellProps) {
  // Controlled without a trigger (opened by a button the shell doesn't own, like the SavingBar's details): Radix
  // would give the focus back to its trigger, which there isn't. Keep what had the focus when it opened instead.
  const opener = useRef<HTMLElement | null>(null);
  const cancel = (
    <DialogPrimitive.Close asChild key="cancel">
      <Button tone="neutral" variant="outline">
        {cancelLabel}
      </Button>
    </DialogPrimitive.Close>
  );
  const confirm = (
    <Button key="confirm" onClick={onConfirm}>
      {confirmLabel}
    </Button>
  );
  const actions = footer ?? (confirmLabel ? (stackedFooter ? [confirm, cancel] : [cancel, confirm]) : null);
  return (
    <DialogPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay
          className={['rds-modal__scrim', `${prefix}__scrim`, !showScrim && 'rds-modal__scrim--clear'].filter(Boolean).join(' ')}
        />
        <DialogPrimitive.Content
          aria-modal="true"
          className={['rds-modal', prefix, ...modifiers, className].filter(Boolean).join(' ')}
          style={boxStyle}
          onOpenAutoFocus={(event) => {
            opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            // The focus opens on the first control of the content, not on the close button.
            const box = event.currentTarget as HTMLElement;
            const first = box.querySelector<HTMLElement>(
              '.rds-modal__body :is(input, textarea, select, button, a[href], [tabindex]:not([tabindex="-1"])):not(:disabled)',
            );
            if (first) {
              event.preventDefault();
              first.focus();
            }
          }}
          onCloseAutoFocus={(event) => {
            if (trigger || !opener.current?.isConnected) return;
            event.preventDefault();
            opener.current.focus();
          }}
          // Without a description, say so explicitly (Radix warns otherwise).
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          {handle}
          <div className="rds-modal__header">
            <div className="rds-modal__heading">
              <DialogPrimitive.Title className={`rds-modal__title ${prefix}__title`}>{title}</DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className={`rds-modal__description ${prefix}__text`}>
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            {closeButton && (
              <Tooltip text={closeLabel}>
                <DialogPrimitive.Close asChild>
                  <IconButton icon={<CloseIcon />} label={closeLabel} tone="neutral" variant="ghost" className="rds-modal__close" />
                </DialogPrimitive.Close>
              </Tooltip>
            )}
          </div>
          {children != null && <div className={`rds-modal__body ${prefix}__text`}>{children}</div>}
          {actions && (
            <div className={['rds-modal__footer', `${prefix}__footer`, stackedFooter && 'rds-modal__footer--stacked'].filter(Boolean).join(' ')}>
              {actions}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Wraps an element that closes the layer when pressed (a "Pronto" Button), with asChild. */
export const ModalClose = DialogPrimitive.Close;
