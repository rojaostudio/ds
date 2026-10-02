'use client';

import type { ComponentPropsWithRef } from 'react';
import { FieldShell, hasContent, useFieldIds, warnIfUnlabelled, type FieldTextProps } from './internal/field';

export interface TextareaProps extends FieldTextProps, Omit<ComponentPropsWithRef<'textarea'>, 'children'> {
  /** Visible lines at first (3 to 5 fits most). Never under 2. The person can make it taller. */
  rows?: number;
}

/**
 * Textarea — Figma [RDS] Forms/Textarea. A multi-line text field with its own label, hint and error; same
 * model and spacing as the Input. The text is the native value (Figma: `content`). Styles: textarea.css
 * and internal/field.css.
 */
export function Textarea({
  label,
  labelPosition,
  hint,
  error,
  errorMessage,
  required,
  id,
  disabled,
  rows = 3,
  className,
  style,
  ...textarea
}: TextareaProps) {
  warnIfUnlabelled('Textarea', label, textarea['aria-label'], textarea['aria-labelledby']);
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, hint, error, errorMessage);
  const floating = labelPosition === 'floating' && hasContent(label);
  return (
    <FieldShell
      kind="rds-textarea"
      controlId={controlId}
      hintId={hintId}
      errorId={errorId}
      label={label}
      labelPosition={labelPosition}
      hint={hint}
      errorMessage={errorMessage}
      invalid={invalid}
      required={required}
      disabled={disabled}
      className={className}
      style={style}
    >
      <textarea
        {...textarea}
        id={controlId}
        className="rds-field__control rds-textarea__control"
        rows={Math.max(2, rows)}
        required={required}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={[describedBy, textarea['aria-describedby']].filter(Boolean).join(' ') || undefined}
        placeholder={floating ? ' ' : textarea.placeholder}
      />
      <svg className="rds-textarea__grip" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M13 6 6 13M13 10l-3 3" />
      </svg>
    </FieldShell>
  );
}
