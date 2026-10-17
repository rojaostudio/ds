'use client';

import { useEffect, useRef, useState, type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from 'react';
import { announce } from './internal/announce';
import { FieldAction, FieldShell, hasContent, warnIfUnlabelled, type FieldTextProps } from './internal/field';
import { useFieldIds } from './internal/field-ids';
import { EyeIcon, EyeOffIcon } from './internal/icons';

export interface PasswordInputProps
  extends FieldTextProps,
    Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'prefix' | 'size'> {
  /**
   * An action on the label's line, on the right (Figma: `showLabelAction` + the exposed Button): a Button variant
   * ghost size sm, such as "Esqueci a senha". A loose action is a Button, not a Link (a Link lives inside a sentence).
   * Outside the <label>; the Tab reaches it after the field, and the label line does not grow.
   */
  labelAction?: ReactNode;
  /** current-password to sign in, new-password to create one: the password manager fills or suggests. */
  autoComplete?: 'current-password' | 'new-password';
  /** Controlled (Figma: `revealed`): the password shows as text. */
  revealed?: boolean;
  /** Uncontrolled: starts shown. */
  defaultRevealed?: boolean;
  onRevealedChange?: (revealed: boolean) => void;
  /** The eye button's accessible name. It stays the same; aria-pressed says whether it is on. */
  revealLabel?: string;
  /** Said to screen readers when the password shows and when it hides again. */
  revealedMessage?: string;
  hiddenMessage?: string;
  /** Shows the strength meter under the field (Figma: `showStrength`). Use it to create a password, never to sign in. */
  showStrength?: boolean;
  /** The level, when the product scores it (a server rule, zxcvbn). Without it the meter scores by itself. */
  strength?: PasswordStrength;
}

export type PasswordStrength = 'none' | 'weak' | 'fair' | 'good' | 'strong';

const LIT: Record<PasswordStrength, number> = { none: 0, weak: 1, fair: 2, good: 3, strong: 4 };

const STRENGTH_WORD: Record<Exclude<PasswordStrength, 'none'>, string> = {
  weak: 'Fraca',
  fair: 'Razoável',
  good: 'Boa',
  strong: 'Forte',
};

/**
 * The meter's own rule: empty is none; under 8 characters is weak; otherwise one point per kind of character
 * (lowercase, uppercase, digit, symbol), plus one at 12 characters: 1 weak, 2 fair, 3 good, 4 or more strong.
 * A guide for the person typing, not a security policy: the product validates on its own.
 */
export function passwordStrength(value: string): PasswordStrength {
  if (!value) return 'none';
  if (value.length < 8) return 'weak';
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(value)).length;
  const score = kinds + (value.length >= 12 ? 1 : 0);
  return score <= 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'good' : 'strong';
}

/**
 * PasswordInput — Figma [RDS] Forms/PasswordInput. A password field with the eye built in, so the person
 * can check what they typed. The eye is a toggle button (aria-pressed) and the change is announced.
 * showStrength adds the strength meter under the field, scored as the person types (passwordStrength) or by the
 * strength prop, with the level announced when it changes.
 * Same field as the Input (styles: internal/field.css; the meter: password-input.css).
 */
export function PasswordInput({
  label,
  labelPosition,
  hint,
  error,
  errorMessage,
  required,
  id,
  disabled,
  className,
  style,
  autoComplete = 'current-password',
  revealed: revealedProp,
  defaultRevealed = false,
  onRevealedChange,
  revealLabel = 'Mostrar senha',
  revealedMessage = 'Senha visível',
  hiddenMessage = 'Senha oculta',
  showStrength = false,
  strength: strengthProp,
  labelAction,
  ...input
}: PasswordInputProps) {
  warnIfUnlabelled('PasswordInput', label, input['aria-label'], input['aria-labelledby']);
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, hint, error, errorMessage);
  const [ownRevealed, setOwnRevealed] = useState(defaultRevealed);
  const revealed = revealedProp ?? ownRevealed;
  const floating = labelPosition === 'floating' && hasContent(label);
  const [typed, setTyped] = useState(String(input.value ?? input.defaultValue ?? ''));
  const value = input.value !== undefined ? String(input.value) : typed;
  const strength = strengthProp ?? passwordStrength(value);
  const strengthId = `${controlId}-strength`;

  // Say the level when it changes, not on every key.
  const said = useRef(strength);
  useEffect(() => {
    if (!showStrength || strength === said.current) return;
    said.current = strength;
    if (strength !== 'none') announce(`Força da senha: ${STRENGTH_WORD[strength].toLowerCase()}`);
  }, [showStrength, strength]);

  function change(event: ChangeEvent<HTMLInputElement>) {
    setTyped(event.target.value);
    input.onChange?.(event);
  }

  function toggle() {
    const next = !revealed;
    setOwnRevealed(next);
    onRevealedChange?.(next);
    announce(next ? revealedMessage : hiddenMessage);
  }

  return (
    <FieldShell
      kind="rds-password-input"
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
      boxClassName="rds-field__box--action"
      labelAction={labelAction}
      afterBox={
        showStrength ? (
          <div id={strengthId} className={`rds-password-input__strength rds-password-input__strength--${strength}`}>
            <span className="rds-password-input__bar" aria-hidden="true">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className={
                    n <= LIT[strength] ? 'rds-password-input__segment rds-password-input__segment--lit' : 'rds-password-input__segment'
                  }
                />
              ))}
            </span>
            <span className="rds-password-input__word">
              {strength !== 'none' && (
                <>
                  <span className="rds-visually-hidden">Força da senha: </span>
                  {STRENGTH_WORD[strength]}
                </>
              )}
            </span>
          </div>
        ) : undefined
      }
      className={className}
      style={style}
    >
      <input
        {...input}
        id={controlId}
        className="rds-field__control"
        type={revealed ? 'text' : 'password'}
        autoComplete={autoComplete}
        spellCheck={false}
        autoCapitalize="none"
        required={required}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onChange={change}
        aria-describedby={[describedBy, showStrength && strengthId, input['aria-describedby']].filter(Boolean).join(' ') || undefined}
        placeholder={floating ? ' ' : input.placeholder}
      />
      <FieldAction
        label={revealLabel}
        aria-pressed={revealed}
        aria-controls={controlId}
        disabled={disabled}
        icon={revealed ? <EyeOffIcon /> : <EyeIcon />}
        onClick={toggle}
      />
    </FieldShell>
  );
}
