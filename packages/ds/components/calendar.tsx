'use client';

import { useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';
import { addDays, addMonths, dayName, fromIso, monthName, toIso, type IsoDate } from './internal/dates';
import { ChevronLeftIcon, ChevronRightIcon } from './internal/icons';

export type { IsoDate };

const WEEKDAYS = [
  ['D', 'domingo'],
  ['S', 'segunda-feira'],
  ['T', 'terça-feira'],
  ['Q', 'quarta-feira'],
  ['Q', 'quinta-feira'],
  ['S', 'sexta-feira'],
  ['S', 'sábado'],
];

/**
 * A span of days, ISO, both ends included. While the person is choosing, `to` is missing: the start is chosen and
 * the end is not yet.
 */
export interface DateRange {
  from?: IsoDate;
  to?: IsoDate;
}

interface CalendarBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** The month shown at first when there is no choice (any ISO day in it). By default, today's month. */
  defaultMonth?: IsoDate;
  /** Days that can't be chosen (past days, weekends). They stay in the grid, faded and struck through. */
  isDateDisabled?: (date: Date) => boolean;
  /** Takes the focus to the chosen day (or today) when it mounts: for the DatePicker's popover. */
  autoFocus?: boolean;
  /** Today, for tests and screenshots. By default the real today. */
  today?: IsoDate;
}

export interface CalendarSingleProps extends CalendarBaseProps {
  /** single (default): one day; range: a start and an end (Figma: `mode`). */
  mode?: 'single';
  /** Controlled: the chosen day, ISO (2026-09-30), or null for none. */
  value?: IsoDate | null;
  /** Uncontrolled: the day chosen at first. */
  defaultValue?: IsoDate;
  /** Called with the ISO day the person chose. */
  onValueChange?: (value: IsoDate) => void;
}

export interface CalendarRangeProps extends CalendarBaseProps {
  /** range: the first choice is the start, the second the end (an earlier day swaps them); a third starts over. */
  mode: 'range';
  /** Controlled: the span, or null for none. */
  value?: DateRange | null;
  /** Uncontrolled: the span at first. */
  defaultValue?: DateRange;
  /** Called on each choice: with only `from` after the first, with both after the second. */
  onValueChange?: (value: DateRange) => void;
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

/** Where a day falls in a span (Figma: .calendar/day `range`): start and end are the chosen plate, middle the band. */
type RangePart = 'start' | 'middle' | 'end';

const startOfGrid = (month: Date) => addDays(month, -month.getDay());
const sameDay = (a: Date | null, b: Date) => a !== null && toIso(a) === toIso(b);

/** The next span after choosing `iso`: a new start, or the end (swapped when earlier than the start). */
function nextRange(range: DateRange | null | undefined, iso: IsoDate): DateRange {
  if (!range?.from || range.to) return { from: iso };
  return iso < range.from ? { from: iso, to: range.from } : { from: range.from, to: iso };
}

function rangePart(range: DateRange | null | undefined, iso: IsoDate): RangePart | undefined {
  if (!range?.from) return undefined;
  const to = range.to ?? range.from;
  if (iso === range.from) return 'start';
  if (iso === to) return 'end';
  return iso > range.from && iso < to ? 'middle' : undefined;
}

const PART_SUFFIX: Record<RangePart, string> = { start: ', início do período', middle: '', end: ', fim do período' };

/**
 * Calendar — Figma [RDS] Forms/Calendar. A month to choose a day: the header with the month and the arrows,
 * the weekdays (Sunday first) and always six weeks, so the height does not jump. role="grid", one day in the
 * tab order: the arrows move a day or a week, PageUp/PageDown change the month, Home/End go to the start and
 * end of the week, Enter or Space choose. `mode="range"` (Figma: `mode`) chooses a span in two steps: start and end
 * are the chosen plate, the days between a continuous band (calendar/day/background/range) with no corners; every
 * day of the span is aria-selected and the ends say so in their name ("1 de outubro de 2026, início do período").
 * Styles: calendar.css.
 */
export function Calendar(props: CalendarProps) {
  const {
    mode: _mode,
    value: _value,
    defaultValue: _defaultValue,
    onValueChange: _onValueChange,
    defaultMonth,
    isDateDisabled,
    autoFocus,
    today: todayIso,
    className,
    ...rest
  } = props;
  const range = props.mode === 'range';
  const titleId = useId();
  const [own, setOwn] = useState<IsoDate | DateRange | undefined>(props.defaultValue);
  const current = props.value !== undefined ? props.value : own;
  const span = range ? (current as DateRange | null | undefined) : undefined;
  const chosen = range ? null : fromIso(current as IsoDate | null | undefined);
  const today = fromIso(todayIso) ?? new Date();
  const [focusDay, setFocusDay] = useState<Date>(() => chosen ?? fromIso(span?.from) ?? fromIso(defaultMonth) ?? today);
  const month = new Date(focusDay.getFullYear(), focusDay.getMonth(), 1);
  const grid = useRef<HTMLTableElement>(null);
  // Focus follows the keyboard only after the person moved (or with autoFocus), never on a plain render.
  const moved = useRef(Boolean(autoFocus));

  useEffect(() => {
    if (!moved.current) return;
    grid.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
  }, [focusDay]);

  const go = (date: Date) => {
    moved.current = true;
    setFocusDay(date);
  };

  const choose = (date: Date) => {
    const iso = toIso(date);
    if (props.mode === 'range') {
      const next = nextRange(span, iso);
      if (props.value === undefined) setOwn(next);
      props.onValueChange?.(next);
    } else {
      if (props.value === undefined) setOwn(iso);
      props.onValueChange?.(iso);
    }
    go(date);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focusDay, -1),
      ArrowRight: () => addDays(focusDay, 1),
      ArrowUp: () => addDays(focusDay, -7),
      ArrowDown: () => addDays(focusDay, 7),
      PageUp: () => addMonths(focusDay, -1),
      PageDown: () => addMonths(focusDay, 1),
      Home: () => addDays(focusDay, -focusDay.getDay()),
      End: () => addDays(focusDay, 6 - focusDay.getDay()),
    };
    const next = moves[event.key];
    if (!next) return;
    event.preventDefault();
    go(next());
  };

  const first = startOfGrid(month);
  const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d)));

  return (
    <div {...rest} className={['rds-calendar', className].filter(Boolean).join(' ')}>
      <div className="rds-calendar__header">
        <Tooltip text="Mês anterior">
          <IconButton
            icon={<ChevronLeftIcon />}
            label="Mês anterior"
            tone="neutral"
            variant="ghost"
            onClick={() => setFocusDay(addMonths(focusDay, -1))}
          />
        </Tooltip>
        <h2 id={titleId} className="rds-calendar__title" aria-live="polite">
          {monthName(month)}
        </h2>
        <Tooltip text="Próximo mês">
          <IconButton
            icon={<ChevronRightIcon />}
            label="Próximo mês"
            tone="neutral"
            variant="ghost"
            onClick={() => setFocusDay(addMonths(focusDay, 1))}
          />
        </Tooltip>
      </div>
      <table ref={grid} role="grid" aria-labelledby={titleId} className="rds-calendar__grid" onKeyDown={onKeyDown}>
        <thead>
          <tr>
            {WEEKDAYS.map(([letter, name], i) => (
              <th key={i} scope="col" abbr={name} className="rds-calendar__weekday">
                <span aria-hidden="true">{letter}</span>
                <span className="rds-visually-hidden">{name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((date) => {
                const iso = toIso(date);
                const outside = date.getMonth() !== month.getMonth();
                const disabled = isDateDisabled?.(date) ?? false;
                const part = range ? rangePart(span, iso) : undefined;
                // A span of one day (or only its start so far) is the plate alone, with no band.
                const band = part && span?.to && span.to !== span.from ? part : undefined;
                const selected = range ? part !== undefined : sameDay(chosen, date);
                const plate = range ? part === 'start' || part === 'end' : selected;
                const isToday = sameDay(today, date);
                return (
                  <td
                    key={iso}
                    role="gridcell"
                    aria-selected={selected}
                    className={['rds-calendar__cell', band && `rds-calendar__cell--range-${band}`].filter(Boolean).join(' ')}
                  >
                    <button
                      type="button"
                      tabIndex={sameDay(focusDay, date) ? 0 : -1}
                      aria-label={dayName(date) + (band ? PART_SUFFIX[band] : '')}
                      aria-current={isToday ? 'date' : undefined}
                      aria-disabled={disabled || undefined}
                      className={[
                        'rds-calendar__day',
                        outside && 'rds-calendar__day--outside',
                        isToday && 'rds-calendar__day--today',
                        plate && 'rds-calendar__day--selected',
                        part === 'middle' && 'rds-calendar__day--range',
                        disabled && 'rds-calendar__day--disabled',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      // A disabled day still takes the focus (it stays in the arrow order) but is not chosen.
                      onClick={() => (disabled ? go(date) : choose(date))}
                    >
                      {date.getDate()}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
