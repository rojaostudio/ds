'use client';

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { FilterChip, FilterChipGroup } from './filter-chip';
import { FieldAction, FieldShell, useFieldIds, warnIfUnlabelled, type FieldTextProps } from './internal/field';
import { MinusIcon, PlusIcon } from './internal/icons';

export interface NumberInputStep {
  /** The value the chip sets. */
  value: number;
  /** What the chip says. By default the value with the unit ("500 un"). */
  label?: ReactNode;
}

export interface NumberInputProps extends Omit<FieldTextProps, 'labelPosition'> {
  /** Controlled: the number (Figma: `value`), or null for none. */
  value?: number | null;
  /** Uncontrolled: the number at first. */
  defaultValue?: number | null;
  /**
   * Called with the new number, after `debounce` ms without another change (a run of + presses sends one value).
   * null when the field is emptied.
   */
  onChange?: (value: number | null) => void;
  /** The smallest value: at it the − turns off (Figma: limit=min). Also the base of the steps. */
  min?: number;
  /** The largest value: at it the + turns off (Figma: limit=max). */
  max?: number;
  /** How much − and + move, and the multiples the value snaps to, counted from `min`. */
  step?: number;
  /** After the number (Figma: `showUnit` + `unit`): un, kg, cx. Read with the value when it is text. */
  unit?: ReactNode;
  /** Named steps under the field (Figma: `showPresets`), as FilterChips: the lots of the domain (500 un, 1000 un). */
  steps?: (number | NumberInputStep)[];
  /** The name of the steps' group. */
  stepsLabel?: string;
  /** Milliseconds without a change before `onChange` fires. 0 sends every change at once. */
  debounce?: number;
  /** The − button's name. */
  decrementLabel?: string;
  /** The + button's name. */
  incrementLabel?: string;
  /** The form field name: a hidden input carries the number. */
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** The name when there is no visible label. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const decimals = (n: number) => (Number.isInteger(n) ? 0 : (String(n).split('.')[1]?.length ?? 0));
const parse = (text: string) => {
  const clean = text.trim().replace(/\s/g, '').replace(',', '.');
  if (clean === '' || clean === '-') return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : NaN;
};

/**
 * NumberInput — Figma [RDS] Forms/NumberInput (rojaostudio/ds#9). A number with − and + in the same frame, segments
 * split by an inner border: for small whole quantities moved a little at a time (items in a cart, people in a
 * booking, instalments). The number in the middle is typed; the field is a spinbutton, so the arrows move it (Page
 * Up/Down by ten steps, Home/End to the limits) and − and + stay out of the Tab order. At a limit its button turns
 * off. A price, a CPF or a CEP is the Input; a continuous range, the Slider; the steps of a flow, the
 * FloatingStepper. Styles: number-input.css and internal/field.css.
 */
export function NumberInput({
  label,
  hint,
  error,
  errorMessage,
  required,
  value,
  defaultValue = null,
  onChange,
  min,
  max,
  step = 1,
  unit,
  steps,
  stepsLabel = 'Valores sugeridos',
  debounce = 300,
  decrementLabel = 'Diminuir',
  incrementLabel = 'Aumentar',
  name,
  placeholder,
  disabled,
  id,
  className,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: NumberInputProps) {
  warnIfUnlabelled('NumberInput', label, ariaLabel, ariaLabelledBy);
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, hint, error, errorMessage);
  const places = Math.max(decimals(step), decimals(min ?? 0));
  const format = (n: number | null) =>
    n === null ? '' : n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: places, useGrouping: false });

  // The number on screen: it moves at once, while onChange waits for the debounce.
  const [current, setCurrent] = useState<number | null>(value !== undefined ? value : defaultValue);
  const [text, setText] = useState(() => format(current));
  const [editing, setEditing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  // The number as of the last change, ahead of the render: presses in a row each start from the one before.
  const latest = useRef(current);
  latest.current = current;

  // A new controlled value (not our own pending one) replaces the number on screen.
  useEffect(() => {
    if (value === undefined || pending.current) return;
    setCurrent(value);
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  const round = (n: number) => Number(n.toFixed(places));

  function emit(next: number | null) {
    latest.current = next;
    setCurrent(next);
    clearTimeout(timer.current);
    if (debounce <= 0) {
      onChange?.(next);
      return;
    }
    pending.current = true;
    timer.current = setTimeout(() => {
      pending.current = false;
      onChange?.(next);
    }, debounce);
  }

  /** One step up or down, landing on the next multiple of `step` counted from `min`. */
  function nudge(direction: 1 | -1, times = 1, start: number | null = latest.current) {
    const base = min ?? 0;
    const from = start ?? (direction > 0 ? (min ?? 0) - step : (max ?? 0) + step);
    const k = (from - base) / step;
    const epsilon = 1e-9;
    const target = direction > 0 ? Math.floor(k + epsilon) + times : Math.ceil(k - epsilon) - times;
    const next = clamp(round(base + target * step));
    setEditing(false);
    if (next !== latest.current) emit(next);
  }

  function commitText() {
    setEditing(false);
    const parsed = parse(text);
    if (parsed === null) {
      if (current !== null) emit(null);
      return;
    }
    if (Number.isNaN(parsed)) return;
    const next = clamp(round(parsed));
    if (next !== current) emit(next);
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    // What is typed and not yet confirmed counts as the start of the move.
    const typed = editing ? parse(text) : current;
    const start = typed === null || Number.isNaN(typed) ? current : clamp(round(typed));
    const moves: Record<string, () => void> = {
      ArrowUp: () => nudge(1, 1, start),
      ArrowDown: () => nudge(-1, 1, start),
      PageUp: () => nudge(1, 10, start),
      PageDown: () => nudge(-1, 10, start),
      Home: () => min !== undefined && emit(min),
      End: () => max !== undefined && emit(max),
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      setEditing(false);
      move();
    } else if (event.key === 'Enter') {
      commitText();
    }
  }

  const atMin = min !== undefined && current !== null && current <= min;
  const atMax = max !== undefined && current !== null && current >= max;
  const shown = editing ? text : format(current);
  const unitText = typeof unit === 'string' || typeof unit === 'number' ? String(unit) : undefined;
  const presets = (steps ?? []).map((s) => (typeof s === 'number' ? { value: s } : s));

  const button = (direction: 1 | -1) => (
    <FieldAction
      label={direction > 0 ? incrementLabel : decrementLabel}
      icon={direction > 0 ? <PlusIcon /> : <MinusIcon />}
      tabIndex={-1}
      disabled={disabled || (direction > 0 ? atMax : atMin)}
      // The focus stays in the field (or goes there), so the arrows keep working after a click.
      onMouseDown={(event) => {
        event.preventDefault();
        input.current?.focus();
      }}
      onClick={() => nudge(direction)}
    />
  );

  return (
    <FieldShell
      kind="rds-number-input"
      controlId={controlId}
      hintId={hintId}
      errorId={errorId}
      label={label}
      hint={hint}
      errorMessage={errorMessage}
      invalid={invalid}
      required={required}
      disabled={disabled}
      boxClassName="rds-number-input__box"
      className={className}
      style={style}
      afterBox={
        presets.length > 0 && (
          <FilterChipGroup aria-label={stepsLabel} className="rds-number-input__steps">
            {presets.map((preset) => (
              <FilterChip
                key={preset.value}
                active={current === preset.value}
                disabled={disabled}
                onActiveChange={() => {
                  setEditing(false);
                  if (current !== preset.value) emit(clamp(preset.value));
                }}
              >
                {preset.label ?? (unitText ? `${format(preset.value)} ${unitText}` : format(preset.value))}
              </FilterChip>
            ))}
          </FilterChipGroup>
        )
      }
    >
      {button(-1)}
      <span className="rds-number-input__divider" aria-hidden="true" />
      <span
        className="rds-number-input__value"
        onMouseDown={(event) => {
          if (event.target !== input.current) {
            event.preventDefault();
            input.current?.focus();
          }
        }}
      >
        <input
          ref={input}
          id={controlId}
          className="rds-field__control"
          type="text"
          role="spinbutton"
          inputMode={places > 0 || (min ?? 0) < 0 ? 'decimal' : 'numeric'}
          autoComplete="off"
          size={Math.max(1, shown.length || (placeholder?.length ?? 1))}
          aria-valuenow={current ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={current !== null && unitText ? `${format(current)} ${unitText}` : undefined}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={shown}
          onChange={(event) => {
            setText(event.target.value.replace(/[^\d,.\-\s]/g, ''));
            setEditing(true);
          }}
          onKeyDown={keyDown}
          onBlur={() => {
            if (editing) commitText();
          }}
        />
        {unit !== undefined && unit !== null && unit !== '' && (
          <span className="rds-number-input__unit" aria-hidden="true">
            {unit}
          </span>
        )}
      </span>
      <span className="rds-number-input__divider" aria-hidden="true" />
      {button(1)}
      {name && <input type="hidden" name={name} value={current ?? ''} />}
    </FieldShell>
  );
}
