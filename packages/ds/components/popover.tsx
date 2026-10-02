'use client';

import { useId, type ReactElement, type ReactNode } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

export type PopoverSide = 'top' | 'bottom' | 'left' | 'right';
export type PopoverAlign = 'start' | 'center' | 'end';

export interface PopoverProps {
  /** The button that opens it (a Button or IconButton). It gets aria-expanded and aria-controls. */
  trigger: ReactElement;
  /** A short title. It also names the box for screen readers. */
  title?: ReactNode;
  /** Without a title, the box's name for screen readers. */
  'aria-label'?: string;
  /** The content (Figma: the `content` slot): text, a short list, a small form, a Button. */
  children: ReactNode;
  side?: PopoverSide;
  align?: PopoverAlign;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * Popover — Figma [RDS] Feedback/Popover. A box that opens next to a button, on click or tap (Radix Popover): more
 * about an item without leaving the screen. Escape and a click outside close it, and the focus goes back to the
 * button. A short name for an icon is the Tooltip; something that demands a decision is a Dialog.
 * Styles: popover.css.
 */
export function Popover({
  trigger,
  title,
  children,
  side = 'bottom',
  align = 'start',
  open,
  defaultOpen,
  onOpenChange,
  className,
  'aria-label': ariaLabel,
}: PopoverProps) {
  const titleId = useId();
  return (
    <PopoverPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={16}
          aria-labelledby={title ? titleId : undefined}
          aria-label={title ? undefined : ariaLabel}
          className={['rds-popover', className].filter(Boolean).join(' ')}
        >
          {title && (
            <p id={titleId} className="rds-popover__title">
              {title}
            </p>
          )}
          <div className="rds-popover__body">{children}</div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/** Wraps an element inside the Popover that closes it when pressed (a "Pronto" Button), with asChild. */
export const PopoverClose = PopoverPrimitive.Close;
