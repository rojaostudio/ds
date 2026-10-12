'use client';

import { createContext, useContext, useId, useMemo, type ComponentPropsWithRef, type ReactNode } from 'react';
import { hasContent } from './internal/field';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { blockWhenDisabled } from './internal/button';
import { toggleClassName, warnIfUnnamed, type ToggleSize, type ToggleVariant } from './internal/toggle';

const VariantContext = createContext<{ variant: ToggleVariant; size: ToggleSize }>({ variant: 'outline', size: 'md' });

export type ToggleGroupProps = ComponentPropsWithRef<typeof ToggleGroupPrimitive.Root> & {
  /** One emphasis for every item (the Toggle `style`; ghost and outline are not mixed in a group). */
  variant?: ToggleVariant;
  /**
   * One size for every item: md (default) 44 tall, sm 32. Under a coarse pointer an sm group spaces its items 12
   * apart, so the 44 touch layers of neighbours never overlap.
   */
  size?: ToggleSize;
  /** Required: what the group chooses ("Vista", "Estilo do texto"). */
  'aria-label': string;
  /** The group is in error (Figma: `error`): the items take the error border. `errorMessage` turns it on too. */
  error?: boolean;
  /**
   * What is missing ("Escolha um tamanho"), rendered right after the group and tied by aria-describedby. Put the
   * group in a vertical stack so the message lands under it.
   */
  errorMessage?: ReactNode;
};

/**
 * ToggleGroup — Figma [RDS] Actions/ToggleGroup. Toggles side by side (Figma: slot `items`).
 * `type="single"`: only one on (Lista or Grade). `type="multiple"`: each one on its own (bold, italic).
 * Tab enters the group, the arrow keys move between items. Styles: toggle-group.css and toggle.css.
 */
export function ToggleGroup({ variant = 'outline', size = 'md', error, errorMessage, className, ...rest }: ToggleGroupProps) {
  const context = useMemo(() => ({ variant, size }), [variant, size]);
  const id = useId();
  const invalid = Boolean(error || hasContent(errorMessage));
  const errorId = invalid && hasContent(errorMessage) ? `${id}-error` : undefined;
  return (
    <VariantContext.Provider value={context}>
      <ToggleGroupPrimitive.Root
        aria-invalid={invalid || undefined}
        {...rest}
        aria-describedby={[rest['aria-describedby'], errorId].filter(Boolean).join(' ') || undefined}
        className={['rds-toggle-group', size === 'sm' && 'rds-toggle-group--sm', invalid && 'rds-toggle-group--error', className]
          .filter(Boolean)
          .join(' ')}
      />
      {errorId && (
        <span id={errorId} className="rds-toggle-group__error-message">
          {errorMessage}
        </span>
      )}
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

/** One option of a ToggleGroup: a Toggle that the group turns on and off, in the group's variant and size. */
export function ToggleGroupItem({ icon, children, disabled, className, onClick, ...rest }: ToggleGroupItemProps) {
  const { variant, size } = useContext(VariantContext);
  warnIfUnnamed('ToggleGroupItem', Boolean(children), rest['aria-label'], rest['aria-labelledby']);
  return (
    <ToggleGroupPrimitive.Item
      {...rest}
      className={toggleClassName(variant, size, Boolean(icon) && !children, className)}
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
