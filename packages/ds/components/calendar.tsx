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

export interface CalendarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Controlled: the chosen day, ISO (2026-09-30), or null for none. */
  value?: IsoDate | null;
  /** Uncontrolled: the day chosen at first. */
  defaultValue?: IsoDate;
  /** Called with the ISO day the person chose. */
  onValueChange?: (value: IsoDate) => void;
  /** The month shown at first when there is no choice (any ISO day in it). By default, today's month. */
  defaultMonth?: IsoDate;
  /** Days that can't be chosen (past days, weekends). They stay in the grid, faded and struck through. */
  isDateDisabled?: (date: Date) => boolean;
  /** Takes the focus to the chosen day (or today) when it mounts: for the DatePicker's popover. */
  autoFocus?: boolean;
  /** Today, for tests and screenshots. By default the real today. */
  today?: IsoDate;
}

const startOfGrid = (month: Date) => addDays(month, -month.getDay());
const sameDay = (a: Date | null, b: Date) => a !== null && toIso(a) === toIso(b);

/**
 * Calendar — Figma [RDS] Forms/Calendar. A month to choose a day: the header with the month and the arrows,
 * the weekdays (Sunday first) and always six weeks, so the height does not jump. role="grid", one day in the
 * tab order: the arrows move a day or a week, PageUp/PageDown change the month, Home/End go to the start and
 * end of the week, Enter or Space choose. A range of two days is not in the Figma yet. Styles: calendar.css.
 */
export function Calendar({
  value,
  defaultValue,
  onValueChange,
  defaultMonth,
  isDateDisabled,
  autoFocus,
  today: todayIso,
  className,
  ...rest
}: CalendarProps) {
  const titleId = useId();
  const [own, setOwn] = useState<IsoDate | undefined>(defaultValue);
  const chosen = fromIso(value !== undefined ? value : own);
  const today = fromIso(todayIso) ?? new Date();
  const [focusDay, setFocusDay] = useState<Date>(() => chosen ?? fromIso(defaultMonth) ?? today);
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
    if (value === undefined) setOwn(iso);
    onValueChange?.(iso);
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
                const outside = date.getMonth() !== month.getMonth();
                const disabled = isDateDisabled?.(date) ?? false;
                const selected = sameDay(chosen, date);
                const isToday = sameDay(today, date);
                return (
                  <td key={toIso(date)} role="gridcell" aria-selected={selected} className="rds-calendar__cell">
                    <button
                      type="button"
                      tabIndex={sameDay(focusDay, date) ? 0 : -1}
                      aria-label={dayName(date)}
                      aria-current={isToday ? 'date' : undefined}
                      aria-disabled={disabled || undefined}
                      className={[
                        'rds-calendar__day',
                        outside && 'rds-calendar__day--outside',
                        isToday && 'rds-calendar__day--today',
                        selected && 'rds-calendar__day--selected',
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
