'use client';

import type { ReactElement, ReactNode } from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { MapPinIcon } from './internal/icons';

export interface HoverCardProps {
  /** The link it opens from: an <a href> to the full page. The card only repeats what is there. */
  children: ReactElement;
  /** Who or what it is (Figma: `title`). */
  title: ReactNode;
  /** What it does (Figma: `description`). */
  description?: ReactNode;
  /** An Avatar (Figma: `showAvatar` + the avatar). */
  avatar?: ReactNode;
  /** One short fact, such as the city, after a pin (Figma: `showMeta` + `meta`). */
  meta?: ReactNode;
  /** ms still before opening, so it does not flash while the mouse crosses the screen. */
  openDelay?: number;
  /** ms after the mouse leaves; it stays open while the mouse is over it. */
  closeDelay?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * HoverCard — Figma [RDS] Feedback/HoverCard. A preview on hovering or focusing a link: who it is, before clicking
 * (Radix HoverCard). Never the only way to the information: on touch it does not open. No buttons inside: that is
 * the Popover. Styles: hover-card.css.
 */
export function HoverCard({
  children,
  title,
  description,
  avatar,
  meta,
  openDelay = 500,
  closeDelay = 300,
  open,
  defaultOpen,
  onOpenChange,
}: HoverCardProps) {
  return (
    <HoverCardPrimitive.Root
      openDelay={openDelay}
      closeDelay={closeDelay}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <HoverCardPrimitive.Trigger asChild>{children}</HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="rds-hover-card"
        >
          {avatar && <span className="rds-hover-card__avatar">{avatar}</span>}
          <div className="rds-hover-card__content">
            <p className="rds-hover-card__title">{title}</p>
            {description && <p className="rds-hover-card__description">{description}</p>}
            {meta && (
              <p className="rds-hover-card__meta">
                <span className="rds-hover-card__meta-icon" aria-hidden="true">
                  <MapPinIcon />
                </span>
                {meta}
              </p>
            )}
          </div>
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  );
}
