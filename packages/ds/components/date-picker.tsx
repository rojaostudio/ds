'use client';

import { useRef, useState, type CSSProperties } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Calendar } from './calendar';
import { formatBr, maskBr, parseBr, type IsoDate } from './internal/dates';
import { FieldAction, FieldShell, useFieldIds, warnIfUnlabelled, type FieldTextProps } from './internal/field';
import { CalendarIcon } from './internal/icons';

export interface DatePickerProps extends FieldTextProps {
  /** Controlled: the date, ISO (2026-09-30), or '' for none (Figma: the Input's `text`). */
  value?: IsoDate;
  /** Uncontrolled: the date at first. */
  defaultValue?: IsoDate;
  /** Called with the ISO date when a valid date is typed or chosen, and with '' when the field is emptied. */
  onValueChange?: (value: IsoDate) => void;
  /** Days that can't be chosen in the calendar. */
  isDateDisabled?: (date: Date) => boolean;
  /** The message when the typed date does not exist (31/02). */
  invalidMessage?: string;
  /** The calendar button's accessible name, also the popover's. */
  pickLabel?: string;
  /** The form field name: a hidden input carries the ISO date. */
  name?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** The name when there is no visible label. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Today, for tests and screenshots. */
  today?: IsoDate;
}

/**
 * DatePicker — Figma [RDS] Forms/DatePicker. A date field that takes typing (dd/mm/aaaa, the slashes come by
 * themselves) and, from the calendar button, opens the Calendar in a popover (Figma: `open`). Choosing a day
 * closes it and gives the focus back to the field; Escape closes without choosing. For a date near today, where
 * seeing the month helps: a birth date is an Input. Styles: date-picker.css, internal/field.css, calendar.css.
 */
export function DatePicker({
  label,
  labelPosition,
  hint,
  error,
  errorMessage,
  required,
  value,
  defaultValue = '',
  onValueChange,
  isDateDisabled,
  invalidMessage = 'Essa data não existe. Use dd/mm/aaaa.',
  pickLabel = 'Escolher data',
  name,
  disabled,
  id,
  className,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  today,
}: DatePickerProps) {
  warnIfUnlabelled('DatePicker', label, ariaLabel, ariaLabelledBy);
  const [own, setOwn] = useState<IsoDate>(defaultValue);
  const iso = value ?? own;
  const [text, setText] = useState(() => formatBr(iso));
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const shown = editing ? text : formatBr(iso);
  const nonexistent = shown.length === 10 && !parseBr(shown);
  const message = nonexistent ? invalidMessage : errorMessage;
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, hint, error || nonexistent, message);
  const floating = labelPosition === 'floating' && Boolean(label);

  const commit = (next: IsoDate) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  return (
    <FieldShell
      kind="rds-date-picker"
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
      boxClassName="rds-field__box--action"
      className={className}
      style={style}
    >
      <input
        ref={input}
        id={controlId}
        className="rds-field__control"
        inputMode="numeric"
        autoComplete="off"
        placeholder={floating ? ' ' : 'dd/mm/aaaa'}
        maxLength={10}
        required={required}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        value={shown}
        onChange={(event) => {
          const masked = maskBr(event.target.value);
          setText(masked);
          setEditing(true);
          if (masked === '') commit('');
          const parsed = parseBr(masked);
          if (parsed) commit(parsed);
        }}
        onBlur={() => {
          if (parseBr(text) || text === '') setEditing(false);
        }}
      />
      {name && <input type="hidden" name={name} value={iso} />}
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild disabled={disabled}>
          <FieldAction label={pickLabel} icon={<CalendarIcon />} />
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            aria-label={pickLabel}
            align="end"
            sideOffset={4}
            className="rds-date-picker__popover"
            // The Calendar takes the focus itself, to the chosen day or today.
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              input.current?.focus();
            }}
          >
            <Calendar
              value={iso || null}
              today={today}
              autoFocus
              isDateDisabled={isDateDisabled}
              onValueChange={(next) => {
                commit(next);
                setText(formatBr(next));
                setEditing(false);
                setOpen(false);
              }}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </FieldShell>
  );
}
