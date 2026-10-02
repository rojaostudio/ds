'use client';

import { useState, type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from 'react';
import { hasContent, useFieldIds, warnIfUnlabelled } from './internal/field';

export type InputOTPLength = 4 | 6;

export interface InputOTPProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'maxLength' | 'pattern' | 'value' | 'defaultValue' | 'children' | 'size'> {
  /** The field's name, such as "Código de verificação" (Figma: `showLabel` + `label`). Without it, pass aria-label. */
  label?: ReactNode;
  /** 4 or 6 digits (Figma: `length`). */
  length?: InputOTPLength;
  /** A dash in the middle of the 6-digit code (Figma: `showSeparator`). On by default; a 4-digit code has none. */
  showSeparator?: boolean;
  /** Where the code went, without the full address: a masked e-mail or phone (Figma: `showHint` + `hint`). */
  hint?: ReactNode;
  /** The code was refused (Figma: `error`): the boxes turn red. The digits stay, so the person can fix one. */
  error?: boolean;
  /** What went wrong and what to do. Replaces the hint and turns the error state on. */
  errorMessage?: ReactNode;
  /** Controlled: the digits typed so far. */
  value?: string;
  /** Uncontrolled: the digits at first. */
  defaultValue?: string;
  /** Called with the digits on every change (letters are dropped). */
  onValueChange?: (value: string) => void;
  /** Called once all the digits are in. */
  onComplete?: (value: string) => void;
}

/**
 * InputOTP — Figma [RDS] Forms/InputOTP. The verification code: one box per digit. One real
 * <input autocomplete="one-time-code" inputmode="numeric"> lies over the boxes, so pasting the whole code and the
 * SMS autofill just work, each digit moves on by itself, and Backspace takes the last one back. Disabled is the
 * native one. Styles: input-otp.css.
 */
export function InputOTP({
  label,
  length = 6,
  showSeparator = true,
  hint,
  error,
  errorMessage,
  value,
  defaultValue = '',
  onValueChange,
  onComplete,
  id,
  disabled,
  className,
  style,
  onChange,
  onFocus,
  onBlur,
  onSelect,
  ...input
}: InputOTPProps) {
  warnIfUnlabelled('InputOTP', label, input['aria-label'], input['aria-labelledby']);
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, hint, error, errorMessage);
  const [own, setOwn] = useState(defaultValue.replace(/\D/g, ''));
  const [focused, setFocused] = useState(false);
  const code = (value ?? own).slice(0, length);
  const split = showSeparator && length === 6 ? 3 : -1;
  const active = focused ? Math.min(code.length, length - 1) : -1;

  function change(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, '').slice(0, length);
    setOwn(digits);
    onChange?.(event);
    onValueChange?.(digits);
    if (digits.length === length && digits !== code) onComplete?.(digits);
  }

  return (
    <div
      className={['rds-otp', invalid && 'rds-otp--error', disabled && 'rds-otp--disabled', className].filter(Boolean).join(' ')}
      style={style}
    >
      {hasContent(label) && (
        <label htmlFor={controlId} className="rds-otp__label">
          {label}
        </label>
      )}
      <div className="rds-otp__slots">
        <input
          {...input}
          id={controlId}
          className="rds-otp__input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          // No maxLength: a pasted "123-456" would be cut at the dash. change() keeps the digits and slices them.
          pattern={`\\d{${length}}`}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={[describedBy, input['aria-describedby']].filter(Boolean).join(' ') || undefined}
          value={code}
          onChange={change}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onSelect={(event) => {
            // The caret always stays after the last digit: the boxes have no caret of their own to move.
            const target = event.currentTarget;
            if (target.selectionStart !== target.value.length) target.setSelectionRange(target.value.length, target.value.length);
            onSelect?.(event);
          }}
        />
        {Array.from({ length }, (_, i) => (
          <span key={i} className="rds-otp__group" aria-hidden="true">
            {i === split && <span className="rds-otp__separator">–</span>}
            <span className={['rds-otp__slot', i === active && 'rds-otp__slot--active'].filter(Boolean).join(' ')}>
              {code[i] ?? ''}
              {i === active && !code[i] && <span className="rds-otp__caret" />}
            </span>
          </span>
        ))}
      </div>
      {errorId ? (
        <span id={errorId} className="rds-otp__support rds-otp__error-message">
          {errorMessage}
        </span>
      ) : (
        hintId && (
          <span id={hintId} className="rds-otp__support rds-otp__hint">
            {hint}
          </span>
        )
      )}
    </div>
  );
}
