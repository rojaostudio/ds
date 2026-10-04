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
  /**
   * md (default): the 44 row, 10 above and below the 24 line, as wide as its container. sm: only the control and its
   * text, 24 tall and as wide as its content (`fit-content`), for a Card header or a 24 line. The 44 touch target
   * stays: an invisible layer around the control (a pseudo-element, no layout) takes the tap (Figma: `size`).
   */
  size?: SwitchSize;
  /**
   * Which side the label goes (Figma: `labelPosition`): end (default) after the control; start before it, with the
   * control at the right edge (the label fills on md; on sm the control comes right after the text) and the hint
   * aligned with the label. Only the visual order changes: the DOM, the tab order and the accessible name stay.
   */
  labelPosition?: SwitchLabelPosition;
}

/** md: the 44 row; sm: the 24 control and its text, hugging its content. */
export type SwitchSize = 'md' | 'sm';
/** end: the label after the control; start: the label first, the control at the right edge. */
export type SwitchLabelPosition = 'end' | 'start';

/**
 * Switch — Figma [RDS] Forms/Switch. Turns on and off a setting that applies right away, with no save
 * button (so no error and no required). Native <input type="checkbox" role="switch">: Space toggles it.
 * Not the Toggle, which turns on a mode or a format. If the setting fails, turn it back and say so.
 * Styles: switch.css and internal/choice.css.
 */
export function Switch({
  children,
  hint,
  disabled,
  id,
  className,
  style,
  onChange,
  onCheckedChange,
  size = 'md',
  labelPosition = 'end',
  ...input
}: SwitchProps) {
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
      className={[size === 'sm' && 'rds-switch--sm', labelPosition === 'start' && 'rds-switch--label-start', className]
        .filter(Boolean)
        .join(' ') || undefined}
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
