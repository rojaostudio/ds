'use client';

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Calendar, type DateRange } from './calendar';
import { Dialog } from './dialog';
import { FilterChip, FilterChipGroup } from './filter-chip';
import { announce } from './internal/announce';
import { addDays, dayName, endOfMonth, formatBr, fromIso, startOfMonth, toIso, type IsoDate } from './internal/dates';
import { FieldShell, useFieldIds, warnIfUnlabelled, type FieldTextProps } from './internal/field';
import { CalendarIcon, CheckIcon } from './internal/icons';
import { useCompact } from './internal/use-compact';

export type { DateRange };

/** A ready span offered beside the calendar (Figma: the `presets` list): "Últimos 7 dias". */
export interface DateRangePreset {
  label: string;
  range: Required<DateRange>;
}

/**
 * The default presets, counted from today: Hoje, Últimos 7 dias (today and the six before), Este mês (from the 1st
 * to today) and Mês passado (the whole month). Spread them to add your own: `[...dateRangePresets(), mine]`.
 */
export function dateRangePresets(today?: IsoDate): DateRangePreset[] {
  const now = fromIso(today) ?? new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const span = (from: Date, to: Date) => ({ from: toIso(from), to: toIso(to) });
  return [
    { label: 'Hoje', range: span(now, now) },
    { label: 'Últimos 7 dias', range: span(addDays(now, -6), now) },
    { label: 'Este mês', range: span(startOfMonth(now), now) },
    { label: 'Mês passado', range: span(lastMonth, endOfMonth(lastMonth)) },
  ];
}

export interface DateRangePickerProps extends Omit<FieldTextProps, 'labelPosition'> {
  /** Controlled: the span, ISO (`{ from: '2026-10-01', to: '2026-10-10' }`), or {} for none. */
  value?: DateRange;
  /** Uncontrolled: the span at first. */
  defaultValue?: DateRange;
  /** Called with the whole span (both ends) when a preset is chosen or the end is chosen in the calendar. */
  onValueChange?: (value: Required<DateRange>) => void;
  /** The ready spans beside the calendar. By default `dateRangePresets(today)`; [] for none. */
  presets?: DateRangePreset[];
  /** Days that can't be chosen in the calendar. */
  isDateDisabled?: (date: Date) => boolean;
  /** The field's text when there is no span. */
  placeholder?: string;
  /** The panel's name (the popover, or the sheet's title on a compact screen). */
  pickLabel?: string;
  /** The presets list's name. */
  presetsLabel?: string;
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

const sameRange = (a: DateRange | undefined, b: DateRange) => Boolean(a?.from && a.from === b.from && a.to === b.to);

/** The span in words, as a screen reader hears it: "de 1 de outubro de 2026 a 10 de outubro de 2026". */
function rangeWords({ from, to }: DateRange) {
  const start = fromIso(from);
  const end = fromIso(to);
  if (!start || !end) return '';
  return from === to ? dayName(start) : `de ${dayName(start)} a ${dayName(end)}`;
}

/**
 * DateRangePicker — Figma [RDS] Forms/DateRangePicker. A period field for filters (financeiro, auditoria,
 * relatórios): the field shows the span (01/10/2026 – 10/10/2026) and opens a panel with the presets on the left
 * (choose one, as the DropdownMenuRadioItem: the chosen one has the check) and the Calendar in `mode="range"`.
 * A preset, or the end day in the calendar, sets the span, closes the panel and gives the focus back to the field;
 * Escape closes without changing it.
 * On a compact screen (below 1024, as the rest of the DS) the panel is the Dialog's sheet: the presets as FilterChips
 * on top and the Calendar below.
 * Keyboard: Tab goes from the presets (a listbox: the arrows move, Enter or Space choose) to the calendar (its own
 * keys). The span chosen is announced ("Período escolhido: de … a …") and stays in the field's description; the
 * start chosen in the calendar is announced inside the panel. Styles: date-range-picker.css, internal/field.css,
 * calendar.css.
 */
export function DateRangePicker({
  label,
  hint,
  error,
  errorMessage,
  required,
  value,
  defaultValue,
  onValueChange,
  presets: presetsProp,
  isDateDisabled,
  placeholder = 'Escolher período',
  pickLabel = 'Escolher período',
  presetsLabel = 'Períodos',
  disabled,
  id,
  className,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  today,
}: DateRangePickerProps) {
  warnIfUnlabelled('DateRangePicker', label, ariaLabel, ariaLabelledBy);
  const compact = useCompact();
  const presets = presetsProp ?? dateRangePresets(today);
  const [own, setOwn] = useState<DateRange>(defaultValue ?? {});
  const range = value ?? own;
  const complete = Boolean(range.from && range.to);
  const [open, setOpen] = useState(false);
  // The span being chosen in the calendar: the start alone after the first day.
  const [draft, setDraft] = useState<DateRange>(range);
  const [status, setStatus] = useState('');
  const { controlId, hintId, errorId, invalid, describedBy } = useFieldIds(id, hint, error, errorMessage);
  const valueId = useId();
  const presetRefs = useRef<(HTMLDivElement | null)[]>([]);

  const chosenPreset = presets.findIndex((p) => sameRange(range, p.range));
  const [activePreset, setActivePreset] = useState(0);

  const openChange = (next: boolean) => {
    if (next) {
      setDraft(range);
      setStatus('');
      setActivePreset(Math.max(chosenPreset, 0));
    }
    setOpen(next);
  };

  const commit = (next: Required<DateRange>) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
    announce(`Período escolhido: ${rangeWords(next)}`);
    setOpen(false);
  };

  const onCalendar = (next: DateRange) => {
    setDraft(next);
    if (next.from && next.to) commit({ from: next.from, to: next.to });
    else if (next.from) setStatus(`Início em ${rangeWords({ from: next.from, to: next.from })}. Agora escolha o fim.`);
  };

  const onPresetKey = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    const last = presets.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: index === last ? 0 : index + 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    if (event.key in moves) {
      event.preventDefault();
      setActivePreset(moves[event.key]);
      presetRefs.current[moves[event.key]]?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      commit(presets[index].range);
    }
  };

  const calendar = (
    <Calendar
      mode="range"
      value={draft}
      today={today}
      defaultMonth={range.from}
      isDateDisabled={isDateDisabled}
      onValueChange={onCalendar}
    />
  );
  const live = (
    <p role="status" className="rds-visually-hidden">
      {status}
    </p>
  );

  const trigger = (
    <button
      type="button"
      id={controlId}
      disabled={disabled}
      className={['rds-field__control', 'rds-date-range-picker__trigger', !complete && 'rds-date-range-picker__trigger--empty']
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-invalid={invalid || undefined}
      aria-required={required || undefined}
      aria-describedby={[complete ? valueId : undefined, describedBy].filter(Boolean).join(' ') || undefined}
      onClick={compact ? () => openChange(true) : undefined}
    >
      <span className="rds-date-range-picker__value" aria-hidden={complete || undefined}>
        {complete ? `${formatBr(range.from)} – ${formatBr(range.to)}` : placeholder}
      </span>
      {complete && (
        <span id={valueId} className="rds-visually-hidden">
          {rangeWords(range)}
        </span>
      )}
      <span className="rds-field__icon" aria-hidden="true">
        <CalendarIcon />
      </span>
    </button>
  );

  return (
    <FieldShell
      kind="rds-date-range-picker"
      controlId={controlId}
      hintId={hintId}
      errorId={errorId}
      label={label}
      hint={hint}
      errorMessage={errorMessage}
      invalid={invalid}
      required={required}
      disabled={disabled}
      className={className}
      style={style}
    >
      {compact ? (
        <>
          {trigger}
          <Dialog open={open} onOpenChange={openChange} title={pickLabel} size="sm">
            <div className="rds-date-range-picker__sheet">
              {presets.length > 0 && (
                <FilterChipGroup aria-label={presetsLabel}>
                  {presets.map((preset) => (
                    <FilterChip
                      key={preset.label}
                      pressed={sameRange(range, preset.range)}
                      onPressedChange={() => commit(preset.range)}
                    >
                      {preset.label}
                    </FilterChip>
                  ))}
                </FilterChipGroup>
              )}
              {calendar}
              {live}
            </div>
          </Dialog>
        </>
      ) : (
        <PopoverPrimitive.Root open={open} onOpenChange={openChange}>
          <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content aria-label={pickLabel} align="start" sideOffset={4} className="rds-date-range-picker__popover">
              <div className="rds-date-range-picker__panel">
                {presets.length > 0 && (
                  <div role="listbox" aria-label={presetsLabel} className="rds-date-range-picker__presets">
                    {presets.map((preset, index) => {
                      const chosen = index === chosenPreset;
                      return (
                        <div
                          key={preset.label}
                          ref={(el) => {
                            presetRefs.current[index] = el;
                          }}
                          role="option"
                          aria-selected={chosen}
                          tabIndex={index === activePreset ? 0 : -1}
                          className="rds-date-range-picker__preset"
                          onClick={() => commit(preset.range)}
                          onKeyDown={(event) => onPresetKey(event, index)}
                          onFocus={() => setActivePreset(index)}
                        >
                          <span className="rds-date-range-picker__check" aria-hidden="true">
                            {chosen && <CheckIcon />}
                          </span>
                          {preset.label}
                        </div>
                      );
                    })}
                  </div>
                )}
                {calendar}
                {live}
              </div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      )}
    </FieldShell>
  );
}
