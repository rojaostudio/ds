'use client';

import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps extends Omit<ComponentPropsWithRef<typeof TooltipPrimitive.Trigger>, 'children' | 'asChild'> {
  /**
   * The control it describes, almost always an IconButton. It must be a single focusable element: it receives the
   * aria-describedby that ties it to the balloon (Radix Tooltip with asChild), not a wrapper around it.
   */
  children: ReactElement;
  /** The action's name, in up to four words (Figma: `text`). Never something the person needs: touch does not show it. */
  text: ReactNode;
  /** Which side of the control the balloon sits on (Figma: `side`). */
  side?: TooltipSide;
  /** ms before it opens on hover. On keyboard focus it opens at once. */
  delay?: number;
}

/**
 * Tooltip — Figma [RDS] Feedback/Tooltip. A short label on hovering or focusing a control (Radix Tooltip):
 * role="tooltip", tied to the focusable control with aria-describedby. Escape closes; the mouse can go over the
 * balloon without it disappearing (WCAG 1.4.13). Styles: tooltip.css.
 *
 * Every IconButton goes with one, with the same text as its label (Figma: IconButton, "Com Tooltip"): they are two
 * components, always together. Any other prop and the ref go to the control, so the pair can itself be the child of
 * another asChild trigger (a DropdownMenu, a Dialog close).
 */
export function Tooltip({ children, text, side = 'top', delay = 300, ...trigger }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger {...trigger} asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content side={side} sideOffset={4} collisionPadding={8} className="rds-tooltip">
            {text}
            <TooltipPrimitive.Arrow className="rds-tooltip__arrow" width={16} height={8} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
