'use client';

import { useId, useMemo, type FieldsetHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { hasContent } from './internal/field';
import { FieldGroupContext } from './internal/field-ids';

export interface FieldGroupProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'children'> {
  /** The group's name (Figma: `legend`), which also says what goes in each field: "Tamanho (largura × altura)". */
  legend: ReactNode;
  /** Shows the asterisk. Pass `required` on each field too, so each control is announced as required. */
  required?: boolean;
  /** A line under the legend (Figma: `showHint` + `hint`), tied by aria-describedby to every field. */
  hint?: ReactNode;
  /**
   * The group is in error (Figma: `error`): every field inside turns red and gets aria-invalid, except the one that
   * passes `error={false}`. Passing `errorMessage` turns it on too.
   */
  error?: boolean;
  /** One message for the whole set, under it, tied by aria-describedby to every field in error. */
  errorMessage?: ReactNode;
  /**
   * The fields (Figma: slot `fields`): Inputs (or Selects, NumberInputs) without a visible label, each named by
   * aria-label, with a FieldGroupSeparator between them. They share the group's width.
   */
  children: ReactNode;
}

/**
 * FieldGroup — Figma [RDS] Forms/FieldGroup (ds#147). Short fields that make one value (width × height, from – to)
 * under one legend and one error: a <fieldset>. The fields inside show only their red border, never a message of
 * their own; focusFirstInvalid lands on the first field in error. Styles: field-group.css.
 */
export function FieldGroup({ legend, required, hint, error, errorMessage, className, children, ...rest }: FieldGroupProps) {
  const id = useId();
  const invalid = Boolean(error || hasContent(errorMessage));
  const hintId = hasContent(hint) ? `${id}-hint` : undefined;
  const errorId = invalid && hasContent(errorMessage) ? `${id}-error` : undefined;
  const group = useMemo(() => ({ invalid, hintId, errorId }), [invalid, hintId, errorId]);
  return (
    <fieldset {...rest} className={['rds-field-group', invalid && 'rds-field-group--error', className].filter(Boolean).join(' ')}>
      <legend className="rds-field__label rds-field-group__legend">
        {legend}
        {required && (
          <span className="rds-field__required" aria-hidden="true">
            {' *'}
          </span>
        )}
      </legend>
      {hintId && (
        <span id={hintId} className="rds-field__support rds-field__hint">
          {hint}
        </span>
      )}
      <div className="rds-field-group__fields">
        <FieldGroupContext.Provider value={group}>{children}</FieldGroupContext.Provider>
      </div>
      {errorId && (
        <span id={errorId} className="rds-field__support rds-field__error-message">
          {errorMessage}
        </span>
      )}
    </fieldset>
  );
}

export interface FieldGroupSeparatorProps extends HTMLAttributes<HTMLSpanElement> {
  /** The sign between the fields (Figma: `symbol`): ×, –, /. */
  children?: ReactNode;
}

/**
 * FieldGroupSeparator — Figma [RDS] Forms/FieldGroupSeparator. The sign between two fields of a FieldGroup, centred
 * on the boxes. Decorative (aria-hidden): the meaning goes in the legend.
 */
export function FieldGroupSeparator({ children = '×', className, ...rest }: FieldGroupSeparatorProps) {
  return (
    <span {...rest} aria-hidden="true" className={['rds-field-group__separator', className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}
