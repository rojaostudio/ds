'use client';

import { useEffect, useRef, type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from 'react';
import { ChoiceRow } from './internal/choice';
import { hasContent, warnIfUnlabelled } from './internal/field';
import { CheckIcon, MinusIcon } from './internal/icons';

export type CheckboxChecked = boolean | 'indeterminate';

export interface CheckboxProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'checked' | 'size'> {
  /** What the person confirms or chooses (Figma: `showLabel` + `label`). Without it, pass aria-label (a table cell). */
  children?: ReactNode;
  /** A line under the label (Figma: `showHint` + `hint`), tied by aria-describedby. */
  hint?: ReactNode;
  /**
   * Controlled (Figma: `checked`). `'indeterminate'` is partly checked: only for the "select all" of a list
   * when some options are checked. Pair it with `onChange` or `onCheckedChange`.
   */
  checked?: CheckboxChecked;
  /** Called with the new checked state on every change. */
  onCheckedChange?: (checked: boolean) => void;
  /** The error state (Figma: `error`). Passing `errorMessage` turns it on too. Inside a CheckboxGroup, the error belongs to the group. */
  error?: boolean;
  /** What is missing and how to fix it ("Aceite os termos para continuar"). Turns the error state on. */
  errorMessage?: ReactNode;
}

/**
 * Checkbox — Figma [RDS] Forms/Checkbox. A box to check: alone for a yes (terms), or in a list inside a
 * CheckboxGroup. Native <input type="checkbox">: Space toggles it, and it goes with the form. Disabled is
 * the native one. Styles: checkbox.css and internal/choice.css.
 */
export function Checkbox({
  children,
  hint,
  checked,
  onCheckedChange,
  error,
  errorMessage,
  required,
  disabled,
  id,
  className,
  style,
  onChange,
  ref,
  ...input
}: CheckboxProps) {
  warnIfUnlabelled('Checkbox', children, input['aria-label'], input['aria-labelledby']);
  const own = useRef<HTMLInputElement | null>(null);
  const indeterminate = checked === 'indeterminate';
  useEffect(() => {
    if (own.current) own.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const invalid = Boolean(error || hasContent(errorMessage));

  function change(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  }

  function setRef(node: HTMLInputElement | null) {
    own.current = node;
    if (node) node.indeterminate = indeterminate;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }

  return (
    <ChoiceRow
      kind="rds-checkbox"
      id={id}
      label={children}
      hint={hint}
      required={required}
      disabled={disabled}
      invalid={invalid}
      errorMessage={errorMessage}
      className={className}
      style={style}
      control={({ id: controlId, describedBy }) => (
        <>
          <input
            {...input}
            ref={setRef}
            id={controlId}
            type="checkbox"
            {...(checked !== undefined ? { checked: checked === true } : {})}
            required={required}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-describedby={[describedBy, input['aria-describedby']].filter(Boolean).join(' ') || undefined}
            onChange={change}
          />
          <span className="rds-checkbox__box" aria-hidden="true">
            <span className="rds-checkbox__check">
              <CheckIcon />
            </span>
            <span className="rds-checkbox__minus">
              <MinusIcon />
            </span>
          </span>
        </>
      )}
    />
  );
}
