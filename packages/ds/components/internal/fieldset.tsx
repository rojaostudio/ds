// The <fieldset> shared by CheckboxGroup and RadioGroup: legend, required mark, hint and group error.
// Not exported from the package. Styles: fieldset.css (layout) and each group's own colours.
import { useId, type FieldsetHTMLAttributes, type ReactNode } from 'react';
import { hasContent } from './field';

export interface ChoiceFieldsetProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'children'> {
  /** The question (Figma: `legend`). It names the group: without it, a screen reader hears only the option. */
  legend: ReactNode;
  /** Shows the asterisk. */
  required?: boolean;
  /** A line under the question (Figma: `showHint` + `hint`), tied by aria-describedby. */
  hint?: ReactNode;
  /** The group is in error (Figma: `error`). Passing `errorMessage` turns it on too. */
  error?: boolean;
  /** What is missing and how to fix it: one message for the whole group. Turns the error state on. */
  errorMessage?: ReactNode;
  /** The options (Figma: slot `options`). */
  children: ReactNode;
}

export function ChoiceFieldset({
  kind,
  legend,
  required,
  hint,
  error,
  errorMessage,
  requiredText,
  className,
  children,
  ...rest
}: ChoiceFieldsetProps & {
  /** The component class (rds-checkbox-group, rds-radio-group). */
  kind: string;
  /** Said after the legend when the group cannot carry aria-required (a plain group). */
  requiredText?: string;
}) {
  const id = useId();
  const invalid = Boolean(error || hasContent(errorMessage));
  const hintId = hasContent(hint) ? `${id}-hint` : undefined;
  const errorId = invalid && hasContent(errorMessage) ? `${id}-error` : undefined;
  return (
    <fieldset
      aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
      {...rest}
      className={['rds-fieldset', kind, invalid && `${kind}--error`, className].filter(Boolean).join(' ')}
    >
      <legend className={`rds-fieldset__legend ${kind}__legend`}>
        {legend}
        {required && (
          <span className={`${kind}__required`} aria-hidden="true">
            {' *'}
          </span>
        )}
        {required && requiredText && <span className="rds-visually-hidden">{` (${requiredText})`}</span>}
      </legend>
      {hintId && (
        <span id={hintId} className={`rds-fieldset__support ${kind}__support ${kind}__hint`}>
          {hint}
        </span>
      )}
      <div className="rds-fieldset__options">{children}</div>
      {errorId && (
        <span id={errorId} className={`rds-fieldset__support ${kind}__support ${kind}__error-message`}>
          {errorMessage}
        </span>
      )}
    </fieldset>
  );
}
