'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { blockWhenDisabled } from './internal/button';
import { toggleClassName, warnIfUnnamed, type ToggleVariant } from './internal/toggle';

export type { ToggleVariant };

export interface ToggleProps extends Omit<ComponentPropsWithRef<typeof TogglePrimitive.Root>, 'children' | 'disabled'> {
  /** The name of what it turns on (Figma: `showLabel` + `label`). It never changes when pressed. Without it, pass aria-label. */
  children?: ReactNode;
  /** Icon before the text (Figma: `showIcon` + `iconName`). Decorative, rendered with aria-hidden. */
  icon?: ReactNode;
  /** The emphasis (Figma: `variant`): ghost in a toolbar, outline when it stands alone. */
  variant?: ToggleVariant;
  /** Rendered as aria-disabled="true": stays in the tab order and takes focus, but does not toggle. */
  disabled?: boolean;
}

/**
 * Toggle — Figma [RDS] Actions/Toggle. A button that stays on or off (aria-pressed). `pressed` +
 * `onPressedChange` to control it, `defaultPressed` to start on (Figma: `pressed`). Not the Switch:
 * a Toggle turns on a mode or a format (bold, list view); a Switch, a setting. Styles: toggle.css.
 */
export function Toggle({ variant = 'ghost', icon, children, disabled, className, onClick, ...rest }: ToggleProps) {
  warnIfUnnamed('Toggle', Boolean(children), rest['aria-label'], rest['aria-labelledby']);
  return (
    <TogglePrimitive.Root
      {...rest}
      className={toggleClassName(variant, className)}
      aria-disabled={disabled || undefined}
      // Radix skips its own toggle when the click was already prevented.
      onClick={blockWhenDisabled(disabled, onClick)}
    >
      {icon && (
        <span className="rds-toggle__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </TogglePrimitive.Root>
  );
}
