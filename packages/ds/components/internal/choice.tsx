// The row shared by Checkbox, Radio and Switch: control, label, required mark, hint and error.
// Not exported from the package. Styles: choice.css (layout) and each component's own colours.
import { useId, type CSSProperties, type ReactNode } from 'react';
import { hasContent } from './field';

export interface ChoiceRowProps {
  /** The component class: rds-checkbox, rds-radio, rds-switch. */
  kind: string;
  /** Renders the native input with the id and the description it must carry. */
  control: (ids: { id: string; describedBy: string | undefined }) => ReactNode;
  /** The visible label (Figma: `showLabel` + `label`). Without it the input needs aria-label. */
  label?: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  errorMessage?: ReactNode;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

export function ChoiceRow({
  kind,
  control,
  label,
  hint,
  required,
  disabled,
  invalid,
  errorMessage,
  id,
  className,
  style,
}: ChoiceRowProps) {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = hasContent(hint) ? `${controlId}-hint` : undefined;
  const errorId = invalid && hasContent(errorMessage) ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div
      className={['rds-choice', kind, invalid && `${kind}--error`, disabled && `${kind}--disabled`, className]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <label className="rds-choice__row" htmlFor={controlId}>
        <span className={`rds-choice__control ${kind}__control`}>{control({ id: controlId, describedBy })}</span>
        {hasContent(label) && (
          <span className={`rds-choice__label ${kind}__label`}>
            {label}
            {required && (
              <span className={`${kind}__required`} aria-hidden="true">
                {' *'}
              </span>
            )}
          </span>
        )}
      </label>
      {hintId && (
        <span id={hintId} className={`rds-choice__support ${kind}__support ${kind}__hint`}>
          {hint}
        </span>
      )}
      {errorId && (
        <span id={errorId} className={`rds-choice__support ${kind}__support ${kind}__error-message`}>
          {errorMessage}
        </span>
      )}
    </div>
  );
}
