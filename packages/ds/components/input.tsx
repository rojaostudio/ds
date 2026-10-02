'use client';

import { useRef, useState, type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from 'react';
import {
  clearNativeValue,
  FieldAction,
  FieldShell,
  hasContent,
  useFieldIds,
  warnIfUnlabelled,
  type FieldLabelPosition,
  type FieldTextProps,
} from './internal/field';
import { CloseIcon } from './internal/icons';

export type { FieldLabelPosition };

export interface InputProps extends FieldTextProps, Omit<ComponentPropsWithRef<'input'>, 'prefix' | 'children' | 'size'> {
  /** An icon on the left, such as a magnifier on a search (Figma: `showLeadingIcon` + `leadingIcon`). Decorative. */
  leadingIcon?: ReactNode;
  /** Text before the value, such as R$ (Figma: `showPrefix` + `prefix`). Not read with the value: if it matters, say it in the label. */
  prefix?: ReactNode;
  /** Text after the value, such as kg (Figma: `showSuffix` + `suffix`). */
  suffix?: ReactNode;
  /** A decorative icon on the right (Figma: `showTrailingIcon` + `trailingIcon`). Hidden while the clear button shows. */
  trailingIcon?: ReactNode;
  /** A clear button on the right while there is a value (Figma: `showClear`). Focus goes back to the field. */
  clearable?: boolean;
  /** Called after the clear button empties the field (onChange fires too, with an empty value). */
  onClear?: () => void;
  /** The clear button's accessible name. */
  clearLabel?: string;
}

/**
 * Input — Figma [RDS] Forms/Input. A one-line text field with its own label, hint and error.
 * email, tel, url, number and search are this Input with the right `type` and `autoComplete`; a search
 * is a leading magnifier plus `clearable`, a currency a `prefix`. The value is the native one
 * (Figma: `text`): `value` + `onChange`, or `defaultValue`. Disabled is the native one. Styles: input.css
 * and internal/field.css.
 */
export function Input({
  label,
  labelPosition,
  hint,
  error,
  errorMessage,
  required,
  leadingIcon,
  prefix,
  suffix,
  trailingIcon,
  clearable,
  onClear,
  clearLabel = 'Limpar',
  id,
  disabled,
  className,
  style,
  onChange,
  ref,
  ...input
}: InputProps) {
  warnIfUnlabelled('Input', label, input['aria-label'], input['aria-labelledby']);
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, hint, error, errorMessage);
  const own = useRef<HTMLInputElement | null>(null);
  const [typed, setTyped] = useState(() => hasContent(input.defaultValue as ReactNode));
  const hasValue = input.value !== undefined ? String(input.value) !== '' : typed;
  const showClear = clearable && hasValue && !disabled;
  const floating = labelPosition === 'floating' && hasContent(label);

  function change(event: ChangeEvent<HTMLInputElement>) {
    setTyped(event.target.value !== '');
    onChange?.(event);
  }

  function setRef(node: HTMLInputElement | null) {
    own.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }

  return (
    <FieldShell
      kind="rds-input"
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
      boxClassName={showClear ? 'rds-field__box--action' : undefined}
      className={className}
      style={style}
    >
      {leadingIcon && (
        <span className="rds-field__icon" aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      {prefix && (
        <span className="rds-field__affix" aria-hidden="true">
          {prefix}
        </span>
      )}
      <input
        {...input}
        ref={setRef}
        id={controlId}
        className="rds-field__control"
        required={required}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={[describedBy, input['aria-describedby']].filter(Boolean).join(' ') || undefined}
        onChange={change}
        // Floating reads :placeholder-shown to know the field is empty; the real placeholder would sit under the label.
        placeholder={floating ? ' ' : input.placeholder}
      />
      {suffix && (
        <span className="rds-field__affix" aria-hidden="true">
          {suffix}
        </span>
      )}
      {trailingIcon && !showClear && (
        <span className="rds-field__icon" aria-hidden="true">
          {trailingIcon}
        </span>
      )}
      {showClear && (
        <FieldAction
          label={clearLabel}
          icon={<CloseIcon />}
          onClick={() => {
            clearNativeValue(own.current);
            own.current?.focus();
            onClear?.();
          }}
        />
      )}
    </FieldShell>
  );
}
