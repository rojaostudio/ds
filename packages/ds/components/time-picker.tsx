'use client';

import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { FieldShell, useFieldIds, warnIfUnlabelled, type FieldTextProps } from './internal/field';
import { ClockIcon } from './internal/icons';
import { OptionContent } from './internal/option-content';
import { useListbox } from './internal/use-listbox';

export type TimeFormat = '24h' | '12h';

export interface TimePickerProps extends FieldTextProps {
  /** Controlled: the time, "HH:mm" in 24 h, or null for none (Figma: the Input's `text`). */
  value?: string | null;
  /** Uncontrolled: the time at first. */
  defaultValue?: string | null;
  /** Called with "HH:mm" (24 h) when a valid time is typed or chosen, and with null when the field is emptied. */
  onChange?: (time: string | null) => void;
  /** The list's step, in minutes: 5, 15 or 30 as the schedule asks. Typing takes any minute. */
  step?: number;
  /** "HH:mm" (24 h): the earliest time, in the list and when typing. */
  min?: string;
  /** "HH:mm" (24 h): the latest time, in the list and when typing. */
  max?: string;
  /** How the time shows: 24h (default) or 12h ("02:30 PM"). The value is always 24 h. */
  format?: TimeFormat;
  /** What shows in the empty field. */
  placeholder?: string;
  /** The message when the typed time does not exist or is out of min and max. */
  invalidMessage?: string;
  /** The form field name: a hidden input carries "HH:mm". */
  name?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** The name when there is no visible label. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};
const fromMinutes = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** "9:30", "09:30", "0930", "2:30 pm" → "HH:mm" (24 h), or null. */
export function parseTime(text: string): string | null {
  const match = text.trim().toLowerCase().match(/^(\d{1,2}):?(\d{2})\s*(am|pm)?$/);
  if (!match) return null;
  let h = Number(match[1]);
  const m = Number(match[2]);
  const period = match[3];
  if (period) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (period === 'pm' ? 12 : 0);
  }
  if (h > 23 || m > 59) return null;
  return fromMinutes(h * 60 + m);
}

/** "HH:mm" as it shows: the same in 24 h, "02:30 PM" in 12 h. */
export function formatTime(time: string, format: TimeFormat = '24h'): string {
  if (format === '24h') return time;
  const [h, m] = time.split(':').map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** 24 h typing: the colon comes by itself after the hour. */
const mask24 = (text: string) => {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
};

/**
 * TimePicker — Figma [RDS] Forms/TimePicker. A time field that takes typing (HH:mm, the colon comes by itself) and
 * opens the list of times in the chosen step (Figma: menu=open). It is the Input with the clock at the end and the
 * Listbox under it (ARIA combobox), as the DatePicker is the Input with the Calendar: the focus stays in the field,
 * the arrows walk the list, Enter chooses and Escape closes without changing. No tokens of its own (--input-*,
 * --listbox-*). A date is the DatePicker; a duration, the NumberInput. Styles: time-picker.css,
 * internal/field.css and internal/listbox.css.
 */
export function TimePicker({
  label,
  labelPosition,
  hint,
  error,
  errorMessage,
  required,
  value,
  defaultValue = null,
  onChange,
  step = 30,
  min,
  max,
  format = '24h',
  placeholder,
  invalidMessage = 'Essa hora não existe. Use HH:mm.',
  name,
  disabled,
  id,
  className,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: TimePickerProps) {
  warnIfUnlabelled('TimePicker', label, ariaLabel, ariaLabelledBy);
  const [own, setOwn] = useState<string | null>(defaultValue);
  const time = value !== undefined ? value : own;
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const low = min ? toMinutes(min) : 0;
  const high = max ? toMinutes(max) : 23 * 60 + 59;
  const inRange = (t: string) => toMinutes(t) >= low && toMinutes(t) <= high;

  const times = useMemo(() => {
    const list: { value: string; label: string }[] = [];
    const every = Math.max(1, Math.round(step));
    for (let m = low; m <= high; m += every) list.push({ value: fromMinutes(m), label: formatTime(fromMinutes(m), format) });
    return list;
  }, [low, high, step, format]);

  const shown = editing ? text : time ? formatTime(time, format) : '';
  const parsed = parseTime(shown);
  const complete = format === '24h' ? shown.length === 5 : /\s*(am|pm)$/i.test(shown);
  const wrong = editing && complete && (!parsed || !inRange(parsed));
  const message = wrong ? invalidMessage : errorMessage;
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, hint, error || wrong, message);
  const floating = labelPosition === 'floating' && Boolean(label);

  function commit(next: string | null) {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  }

  const { listId, setActive, onKeyDown: listKeyDown, controlProps, listProps, optionProps } = useListbox({
    items: times,
    showing: open,
    selected: time ? [time] : [],
    onOpen: () => setOpen(true),
    onChoose: (row) => {
      commit(row.value);
      setEditing(false);
      setOpen(false);
      setActive(-1);
    },
  });

  /** Opens the list with the chosen time (or the nearest one) under the cursor. */
  function openList() {
    if (open || disabled) return;
    setOpen(true);
    const target = time ? toMinutes(time) : -1;
    const index = target < 0 ? -1 : times.findIndex((t) => toMinutes(t.value) >= target);
    setActive(index);
    if (index >= 0) {
      requestAnimationFrame(() => document.getElementById(listId)?.children[index]?.scrollIntoView({ block: 'nearest' }));
    }
  }

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Closed, an arrow opens the list on the chosen time.
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      openList();
      return;
    }
    if (listKeyDown(event)) return;
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      close();
    }
  }

  return (
    <FieldShell
      kind="rds-time-picker"
      controlId={controlId}
      hintId={hintId}
      errorId={errorId}
      label={label}
      labelPosition={labelPosition}
      hint={hint}
      errorMessage={message}
      invalid={invalid}
      required={required}
      disabled={disabled}
      className={className}
      style={style}
    >
      <input
        ref={input}
        id={controlId}
        className="rds-field__control"
        type="text"
        role="combobox"
        inputMode={format === '24h' ? 'numeric' : 'text'}
        autoComplete="off"
        aria-autocomplete="none"
        {...controlProps}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        required={required}
        disabled={disabled}
        placeholder={floating ? ' ' : (placeholder ?? (format === '24h' ? 'HH:mm' : 'hh:mm AM'))}
        maxLength={format === '24h' ? 5 : 8}
        value={shown}
        onChange={(event) => {
          const next = format === '24h' ? mask24(event.target.value) : event.target.value;
          setText(next);
          setEditing(true);
          if (next === '') commit(null);
          const typed = parseTime(next);
          const done = format === '24h' ? next.length === 5 : /\s*(am|pm)$/i.test(next);
          if (typed && done && inRange(typed)) commit(typed);
        }}
        onClick={() => (open ? close() : openList())}
        onKeyDown={keyDown}
        onBlur={() => {
          close();
          const typed = parseTime(text);
          if (text === '' || (typed && inRange(typed))) setEditing(false);
        }}
      />
      <span
        className="rds-field__icon rds-time-picker__clock"
        aria-hidden="true"
        onMouseDown={(event) => {
          // The clock opens the list like the field does, keeping the focus in the field.
          event.preventDefault();
          if (disabled) return;
          input.current?.focus();
          if (open) close();
          else openList();
        }}
      >
        <ClockIcon />
      </span>
      {name && <input type="hidden" name={name} value={time ?? ''} />}
      {open && (
        <ul {...listProps} aria-label={typeof label === 'string' ? label : (ariaLabel ?? 'Horários')} className="rds-listbox rds-time-picker__list">
          {times.map((row, index) => (
            <li key={row.value} {...optionProps(row, index)} className="rds-listbox__option">
              <OptionContent selected={row.value === time}>{row.label}</OptionContent>
            </li>
          ))}
        </ul>
      )}
    </FieldShell>
  );
}
