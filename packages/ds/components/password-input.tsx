'use client';

import { useState, type ComponentPropsWithRef } from 'react';
import { announce } from './internal/announce';
import { FieldAction, FieldShell, hasContent, useFieldIds, warnIfUnlabelled, type FieldTextProps } from './internal/field';
import { EyeIcon, EyeOffIcon } from './internal/icons';

export interface PasswordInputProps
  extends FieldTextProps,
    Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'prefix' | 'size'> {
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
}

/**
 * PasswordInput — Figma [RDS] Forms/PasswordInput. A password field with the eye built in, so the person
 * can check what they typed. The eye is a toggle button (aria-pressed) and the change is announced.
 * Same field as the Input (styles: internal/field.css).
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
  ...input
}: PasswordInputProps) {
  warnIfUnlabelled('PasswordInput', label, input['aria-label'], input['aria-labelledby']);
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, hint, error, errorMessage);
  const [ownRevealed, setOwnRevealed] = useState(defaultRevealed);
  const revealed = revealedProp ?? ownRevealed;
  const floating = labelPosition === 'floating' && hasContent(label);

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
        aria-describedby={[describedBy, input['aria-describedby']].filter(Boolean).join(' ') || undefined}
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
