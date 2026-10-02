'use client';

import type { ChangeEvent, ComponentPropsWithRef, ReactNode } from 'react';
import { ChoiceRow } from './internal/choice';
import { warnIfUnlabelled } from './internal/field';

export interface SwitchProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'role' | 'size'> {
  /** The setting it turns on (Figma: `showLabel` + `label`). It never changes with the state. Without it, pass aria-label. */
  children?: ReactNode;
  /** A line under the label (Figma: `showHint` + `hint`), tied by aria-describedby. */
  hint?: ReactNode;
  /** Called with the new state on every change (Figma: `checked`; `checked` + `onCheckedChange` to control it). */
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Switch — Figma [RDS] Forms/Switch. Turns on and off a setting that applies right away, with no save
 * button (so no error and no required). Native <input type="checkbox" role="switch">: Space toggles it.
 * Not the Toggle, which turns on a mode or a format. If the setting fails, turn it back and say so.
 * Styles: switch.css and internal/choice.css.
 */
export function Switch({ children, hint, disabled, id, className, style, onChange, onCheckedChange, ...input }: SwitchProps) {
  warnIfUnlabelled('Switch', children, input['aria-label'], input['aria-labelledby']);

  function change(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  }

  return (
    <ChoiceRow
      kind="rds-switch"
      id={id}
      label={children}
      hint={hint}
      disabled={disabled}
      className={className}
      style={style}
      control={({ id: controlId, describedBy }) => (
        <>
          <input
            {...input}
            id={controlId}
            type="checkbox"
            role="switch"
            disabled={disabled}
            aria-describedby={[describedBy, input['aria-describedby']].filter(Boolean).join(' ') || undefined}
            onChange={change}
          />
          <span className="rds-switch__track" aria-hidden="true">
            <span className="rds-switch__thumb" />
          </span>
        </>
      )}
    />
  );
}
