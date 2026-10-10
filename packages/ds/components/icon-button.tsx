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

export interface IconButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** The only content of the button (Figma: `iconName`). */
  icon: ReactNode;
  /** Required: the name a screen reader announces ("Fechar", "Mostrar senha"). Rendered as aria-label. */
  label: string;
  /** Same tones as the Button. */
  tone?: ButtonTone;
  /** The emphasis (Figma: `variant`). */
  variant?: ButtonVariant;
  /**
   * The size of the square (Figma: `size`): sm 36 with a 16 icon, md 44 with a 20 icon (default), lg 52 with a 24
   * icon. The touch target is 44 × 44 in every size: on sm, an invisible layer extends it under a coarse pointer.
   */
  size?: ButtonSize;
  /** Rendered as aria-disabled="true", as in the Button. */
  disabled?: boolean;
  /** Render the single child element (an empty `<a>`, a framework `Link`) with the button's classes. */
  asChild?: boolean;
  /** Waiting for what the click started (Figma: `loading`): the icon gives way to a turning loader. */
  loading?: boolean;
  /** What is being waited for, announced while loading. */
  loadingLabel?: string;
  /** Only with `asChild`: the link element; the icon is placed inside it. */
  children?: ReactNode;
  /**
   * A number in the top right corner, such as unread notifications (Figma: `showCount` + `count`): a danger pill,
   * "99+" above 99. Gone with 0 or undefined. The number joins the accessible name after `label`: "Notificações, 3".
   */
  count?: number;
  /** What the number counts, said after it in the name: "não lidas" → "Notificações, 3 não lidas". */
  countLabel?: string;
}

/** The accessible name with the count: "Notificações, 3 não lidas". */
const countedName = (label: string, count: number | undefined, countLabel?: string) =>
  count !== undefined && count > 0 ? `${label}, ${count}${countLabel ? ` ${countLabel}` : ''}` : label;

/**
 * IconButton — Figma [RDS] Actions/IconButton. A square of 36, 44 (default) or 52, same tones, sizes and tokens as
 * the Button.
 *
 * The icon alone does not say what the button does: always pair it with a Tooltip carrying the same text as `label`,
 * shown on hover and on keyboard focus. They are two components (no tooltip inside this one), always together:
 *
 * ```tsx
 * <Tooltip text="Novo cliente">
 *   <IconButton icon={<PlusIcon />} label="Novo cliente" />
 * </Tooltip>
 * ```
 *
 * Every IconButton the design system renders itself (closes, arrows, "Mais ações") already comes with its Tooltip.
 */
export function IconButton({
  icon,
  label,
  tone = 'action',
  variant = 'fill',
  size = 'md',
  disabled,
  loading,
  loadingLabel = 'Carregando…',
  asChild,
  type = 'button',
  className,
  onClick,
  children,
  count,
  countLabel,
  ...rest
}: IconButtonProps) {
  const Root = asChild ? Slot : 'button';
  const hasCount = count !== undefined && count > 0;
  const iconNode = (
    <>
      <span className={loading ? 'rds-button__icon rds-button__loader' : 'rds-button__icon'} aria-hidden="true">
        {loading ? <Loader /> : icon}
      </span>
      {hasCount && (
        <span className="rds-button__count" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </>
  );
  useLoadingAnnouncement(loading, loadingLabel);
  return (
    <Root
      {...rest}
      type={asChild ? undefined : type}
      aria-label={countedName(label, count, countLabel)}
      className={buttonClassName(
        tone,
        variant,
        size,
        ['rds-button--icon-only', hasCount && 'rds-button--counted', className].filter(Boolean).join(' '),
      )}
      aria-disabled={disabled || undefined}
      aria-busy={loading || undefined}
      onClick={blockWhenDisabled(disabled || loading, onClick)}
    >
      {asChild ? <Slottable>{children}</Slottable> : iconNode}
      {asChild && iconNode}
    </Root>
  );
}
