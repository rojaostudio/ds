'use client';

import { createContext, useContext, type ComponentPropsWithRef, type ReactNode } from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { blockWhenDisabled } from './internal/button';
import { toggleClassName, warnIfUnnamed, type ToggleVariant } from './internal/toggle';

const VariantContext = createContext<ToggleVariant>('outline');

export type ToggleGroupProps = ComponentPropsWithRef<typeof ToggleGroupPrimitive.Root> & {
  /** One emphasis for every item (the Toggle `style`; ghost and outline are not mixed in a group). */
  variant?: ToggleVariant;
  /** Required: what the group chooses ("Vista", "Estilo do texto"). */
  'aria-label': string;
};

/**
 * ToggleGroup — Figma [RDS] Actions/ToggleGroup. Toggles side by side (Figma: slot `items`).
 * `type="single"`: only one on (Lista or Grade). `type="multiple"`: each one on its own (bold, italic).
 * Tab enters the group, the arrow keys move between items. Styles: toggle-group.css and toggle.css.
 */
export function ToggleGroup({ variant = 'outline', className, ...rest }: ToggleGroupProps) {
  return (
    <VariantContext.Provider value={variant}>
      <ToggleGroupPrimitive.Root {...rest} className={['rds-toggle-group', className].filter(Boolean).join(' ')} />
    </VariantContext.Provider>
  );
}

export interface ToggleGroupItemProps
  extends Omit<ComponentPropsWithRef<typeof ToggleGroupPrimitive.Item>, 'children' | 'disabled'> {
  /** The option's name (the Toggle `label`). Without it, pass aria-label. */
  children?: ReactNode;
  /** Icon before the text. Decorative, rendered with aria-hidden. */
  icon?: ReactNode;
  /** Rendered as aria-disabled="true", as in the Toggle. */
  disabled?: boolean;
}

/** One option of a ToggleGroup: a Toggle that the group turns on and off. */
export function ToggleGroupItem({ icon, children, disabled, className, onClick, ...rest }: ToggleGroupItemProps) {
  const variant = useContext(VariantContext);
  warnIfUnnamed('ToggleGroupItem', Boolean(children), rest['aria-label'], rest['aria-labelledby']);
  return (
    <ToggleGroupPrimitive.Item
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
    </ToggleGroupPrimitive.Item>
  );
}
