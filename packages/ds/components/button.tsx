'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import {
  blockWhenDisabled,
  buttonClassName,
  Loader,
  useLoadingAnnouncement,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from './internal/button';

export type { ButtonSize, ButtonTone, ButtonVariant };

/** Which side of the text the icon goes (Figma: `iconPosition`). */
export type ButtonIconPosition = 'start' | 'end';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  /** The button text (Figma: `label`): a verb or a destination. Required, it is the accessible name. */
  children: ReactNode;
  /**
   * The role: brand click (action), quiet (neutral) or destructive (danger). Over the brand colour, apply the theme's
   * brand mode to the band (`.ds-plate`) and use neutral.
   */
  tone?: ButtonTone;
  /** The emphasis (Figma: `variant`): fill draws the most attention, ghost the least. */
  variant?: ButtonVariant;
  /**
   * The height, by the space available (Figma: `size`): sm 36, md 44 (default), lg 52. Text 14/20 on sm and md,
   * 16/24 on lg. The touch target is 44 × 44 in every size: on sm, an invisible layer extends it under a coarse
   * pointer (`@media (pointer: coarse)`), so keep two sm buttons at least 8px apart.
   */
  size?: ButtonSize;
  /** Icon next to the text (Figma: `showIcon` + `iconName`). Decorative, rendered with aria-hidden. */
  icon?: ReactNode;
  /**
   * The side of the icon (Figma: `iconPosition`): `end` (default) after the text, `start` before it. The loader
   * takes the icon's side. It does not change the accessible name.
   */
  iconPosition?: ButtonIconPosition;
  /** Rendered as aria-disabled="true": the button stays in the tab order and takes focus, but clicks do nothing. */
  disabled?: boolean;
  /**
   * Waiting for what the click started (Figma: `loading`): the icon gives way to a turning loader (without an
   * icon, the loader covers the label), the width stays, clicks are ignored, aria-busy is on and
   * `loadingLabel` is announced to screen readers.
   */
  loading?: boolean;
  /** What is being waited for, announced while loading ("Salvando…"). */
  loadingLabel?: string;
  /**
   * Render the single child element (an `<a>`, a framework `Link`) with the button's classes and behavior
   * instead of a `<button>`. Use it for navigation: a link that looks like a button.
   */
  asChild?: boolean;
}

/**
 * Button — Figma [RDS] Actions/Button. Three tones,
 * three variants, three sizes (sm 36, md 44, lg 52; the touch target is 44 in all of them), and the icon on
 * either side of the text. Styles: button.css.
 *
 * ```tsx
 * <Button size="sm" icon={<PlusIcon />} iconPosition="start">Novo cliente</Button>
 * ```
 */
export function Button({
  tone = 'action',
  variant = 'fill',
  size = 'md',
  icon,
  iconPosition = 'end',
  disabled,
  loading,
  loadingLabel = 'Carregando…',
  asChild,
  type = 'button',
  className,
  onClick,
  children,
  ...rest
}: ButtonProps) {
  const Root = asChild ? Slot : 'button';
  useLoadingAnnouncement(loading, loadingLabel);
  // Without an icon, the loader covers the label (still there, holding the width and the name).
  const overlay = loading && !icon;
  const iconNode = (icon || loading) && (
    <span className={loading ? 'rds-button__icon rds-button__loader' : 'rds-button__icon'} aria-hidden="true">
      {loading ? <Loader /> : icon}
    </span>
  );
  const start = iconPosition === 'start';
  return (
    <Root
      {...rest}
      type={asChild ? undefined : type}
      className={buttonClassName(tone, variant, size, [overlay && 'rds-button--loading', className].filter(Boolean).join(' '))}
      aria-disabled={disabled || undefined}
      aria-busy={loading || undefined}
      onClick={blockWhenDisabled(disabled || loading, onClick)}
    >
      {start && iconNode}
      <Slottable>{children}</Slottable>
      {!start && iconNode}
    </Root>
  );
}
