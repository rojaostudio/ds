'use client';

import { Children, isValidElement, useId } from 'react';
import { hasContent } from './internal/field';
import { ChoiceFieldset, type ChoiceFieldsetProps } from './internal/fieldset';
import { RadioGroupContext } from './internal/radio-context';

export interface RadioGroupProps extends Omit<ChoiceFieldsetProps, 'onChange' | 'defaultValue'> {
  /** The form field name shared by every option. By default a generated one. */
  name?: string;
  /** Controlled: the chosen option's value. */
  value?: string;
  /** Uncontrolled: the option chosen at first. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

/**
 * RadioGroup — Figma [RDS] Forms/RadioGroup. A question and 2 to 5 single-choice options (Radio children,
 * Figma slot `options`) in a <fieldset role="radiogroup">, with the group's hint and error. Tab enters on the
 * chosen option; the arrows move and choose (native radios sharing one name). Styles: radio-group.css and
 * internal/fieldset.css.
 */
export function RadioGroup({ name, value, defaultValue, onValueChange, required, disabled, error, ...rest }: RadioGroupProps) {
  const generated = useId();
  const invalid = Boolean(error || hasContent(rest.errorMessage));
  const first = Children.toArray(rest.children).find(
    (child) => isValidElement<{ value?: string }>(child) && child.props.value !== undefined,
  );
  const firstValue = isValidElement<{ value?: string }>(first) ? first.props.value : undefined;
  return (
    <RadioGroupContext.Provider
      value={{ name: name ?? generated, value, defaultValue, onValueChange, required, firstValue, disabled, error: invalid }}
    >
      {/* Required and invalid are said once, on the group; the native required goes only on the first radio. */}
      <ChoiceFieldset
        kind="rds-radio-group"
        role="radiogroup"
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        required={required}
        disabled={disabled}
        error={invalid}
        {...rest}
      />
    </RadioGroupContext.Provider>
  );
}
