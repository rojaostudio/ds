'use client';

import { useId, useState, type ChangeEvent, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from 'react';
import { hasContent, warnIfUnlabelled } from './internal/field';

export interface SliderProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'value' | 'defaultValue' | 'min' | 'max' | 'step' | 'children' | 'size'> {
  /** What is chosen ("Volume por dia") (Figma: `showLabel` + `label`). Without it, pass aria-label. */
  label?: ReactNode;
  /** The number beside the label (Figma: `showValue`). On by default: dragging without seeing the number is a guess. */
  showValue?: boolean;
  /** Controlled value (Figma: `value`). */
  value?: number;
  /** Uncontrolled: the value at first. */
  defaultValue?: number;
  /** Called with the new number on every change. */
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  /** The step of the arrows (Figma: 5 in 5). */
  step?: number;
  /** How the number reads, on screen and for screen readers ("75%", "1.500 por dia"). */
  formatValue?: (value: number) => string;
}

/**
 * Slider — Figma [RDS] Forms/Slider. A value in a known range where close is good enough: a native
 * <input type="range">. The arrows move a step, PageUp/PageDown a bigger one, Home and End go to the ends. The
 * thumb is 20, the touch area 44. Disabled is the native one (Figma: `state`). A range of two thumbs is not in
 * the Figma yet. Styles: slider.css.
 */
export function Slider({
  label,
  showValue = true,
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 5,
  formatValue = String,
  id,
  disabled,
  className,
  style,
  onChange,
  ...input
}: SliderProps) {
  warnIfUnlabelled('Slider', label, input['aria-label'], input['aria-labelledby']);
  const generated = useId();
  const controlId = id ?? generated;
  const [own, setOwn] = useState(defaultValue ?? min);
  const current = value ?? own;
  const percent = ((current - min) / (max - min || 1)) * 100;
  const labelled = hasContent(label);

  function change(event: ChangeEvent<HTMLInputElement>) {
    const next = Number(event.target.value);
    setOwn(next);
    onChange?.(event);
    onValueChange?.(next);
  }

  return (
    <div
      // Disabled, the slider is an inactive group: its lighter label and number are exempt from text contrast
      // (WCAG 1.4.3), like the disabled control itself.
      role={disabled ? 'group' : undefined}
      aria-disabled={disabled || undefined}
      className={['rds-slider', disabled && 'rds-slider--disabled', className].filter(Boolean).join(' ')}
      style={{ ...style, '--_percent': `${percent}%` } as CSSProperties}
    >
      {(labelled || showValue) && (
        <div className="rds-slider__label-row">
          {labelled && (
            <label htmlFor={controlId} className="rds-slider__label">
              {label}
            </label>
          )}
          {/* Read through aria-valuetext, so hidden from the reading order. */}
          {showValue && (
            <span className="rds-slider__value" aria-hidden="true">
              {formatValue(current)}
            </span>
          )}
        </div>
      )}
      <input
        {...input}
        id={controlId}
        type="range"
        className="rds-slider__input"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-valuetext={formatValue(current)}
        value={current}
        onChange={change}
      />
    </div>
  );
}
