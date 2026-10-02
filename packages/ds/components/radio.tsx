'use client';

import { useContext, type ComponentPropsWithRef, type ReactNode } from 'react';
import { ChoiceRow } from './internal/choice';
import { warnIfUnlabelled } from './internal/field';
import { RadioGroupContext } from './internal/radio-context';

export interface RadioProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'name' | 'value' | 'checked' | 'defaultChecked' | 'size'> {
  /** The option's value, sent with the form and used by the RadioGroup's `value`. */
  value: string;
  /** The option's text (Figma: `showLabel` + `label`). Without it, pass aria-label. */
  children?: ReactNode;
  /** A line under the label (Figma: `showHint` + `hint`), tied by aria-describedby. */
  hint?: ReactNode;
}

/**
 * Radio — Figma [RDS] Forms/Radio. One single-choice option. It only exists inside a RadioGroup, which gives
 * it the name, the chosen value, required, disabled and the error. Native <input type="radio">.
 * Styles: radio.css and internal/choice.css.
 */
export function Radio({ value, children, hint, disabled, id, className, style, onChange, ...input }: RadioProps) {
  const group = useContext(RadioGroupContext);
  if (!group) console.warn('[@rojaostudio/ds] Radio: use it inside a RadioGroup. A Radio alone is not a choice.');
  warnIfUnlabelled('Radio', children, input['aria-label'], input['aria-labelledby']);
  const controlled = group?.value !== undefined;
  const off = disabled || group?.disabled;
  return (
    <ChoiceRow
      kind="rds-radio"
      id={id}
      label={children}
      hint={hint}
      disabled={off}
      invalid={group?.error}
      className={className}
      style={style}
      control={({ id: controlId, describedBy }) => (
        <>
          <input
            {...input}
            id={controlId}
            type="radio"
            name={group?.name}
            value={value}
            required={group?.required && (group.firstValue === undefined || group.firstValue === value)}
            disabled={off}
            aria-describedby={[describedBy, input['aria-describedby']].filter(Boolean).join(' ') || undefined}
            {...(controlled ? { checked: group?.value === value } : { defaultChecked: group?.defaultValue === value })}
            onChange={(event) => {
              onChange?.(event);
              if (event.target.checked) group?.onValueChange?.(value);
            }}
          />
          <span className="rds-radio__circle" aria-hidden="true" />
        </>
      )}
    />
  );
}
