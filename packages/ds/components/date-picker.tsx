'use client';

import { forwardRef, useState, useRef, useEffect, useId, useImperativeHandle, type ReactNode } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Popover } from './popover';

/**
 * DatePicker — input de data com calendar popover.
 *
 * Uso:
 *   <DatePicker value={date} onChange={setDate} />
 *   <DatePicker value={date} onChange={setDate} min={new Date()} />
 *   <DatePicker value={date} onChange={setDate} placeholder="Selecione" />
 *
 * Sem dependências externas — calendar próprio (mês/ano nav, semana ISO).
 * Locale pt-BR por default (segunda como primeiro dia).
 *
 * Limitações conscientes (MVP):
 *   - Single date só (sem range)
 */

export interface DatePickerProps {
  /** Label renderada acima do controle (mesmo padrão do Input do DS). */
  label?:       ReactNode;
  value:        Date | null;
  onChange:     (date: Date | null) => void;
  min?:         Date;
  max?:         Date;
  placeholder?: string;
  size?:        'sm' | 'md';
  width?:       'full' | 'hug';
  /** locale pra formato. default = 'pt-BR'. */
  locale?:      string;
  /** Primeiro dia da semana. default = 1 (segunda). */
  weekStartsOn?: 0 | 1;
  disabled?:    boolean;
  /** Texto label dos dias da semana (S T Q ...). default = pt-BR. */
  weekdayLabels?: string[];
  className?:   string;
  'aria-label'?: string;
}

const PT_WEEKDAYS_MON_FIRST = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const PT_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const SIZE_CLASS = {
  sm: 'h-8 text-caption px-2.5',
  md: 'h-10 text-label px-3',
} as const;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function buildMonthGrid(year: number, month: number, weekStartsOn: 0 | 1): Date[] {
  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay(); // 0=dom
  const offset = (firstWeekday - weekStartsOn + 7) % 7;
  const start = new Date(year, month, 1 - offset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return days;
}

export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker({
  label,
  value,
  onChange,
  min,
  max,
  placeholder = 'Selecione…',
  size = 'md',
  width = 'full',
  locale = 'pt-BR',
  weekStartsOn = 1,
  disabled = false,
  weekdayLabels,
  className = '',
  'aria-label': ariaLabel,
}, ref) {
  const triggerId = useId();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ year: number; month: number }>(() => {
    const r = value ?? new Date();
    return { year: r.getFullYear(), month: r.getMonth() };
  });
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  const triggerRef   = useRef<HTMLButtonElement>(null);
  const activeDayRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => triggerRef.current!);

  // Sincroniza view com value quando abre
  useEffect(() => {
    if (open && value) {
      setView({ year: value.getFullYear(), month: value.getMonth() });
    }
  }, [open, value]);

  // Reset focusedDate quando fecha
  useEffect(() => {
    if (!open) setFocusedDate(null);
  }, [open]);

  // Foco programático no dia ativo após nav por teclado
  useEffect(() => {
    if (focusedDate) activeDayRef.current?.focus();
  }, [focusedDate]);

  function isDisabled(date: Date): boolean {
    if (min && startOfDay(date) < startOfDay(min)) return true;
    if (max && startOfDay(date) > startOfDay(max)) return true;
    return false;
  }

  function handleSelect(date: Date) {
    if (isDisabled(date)) return;
    onChange(date);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    triggerRef.current?.focus();
  }

  function handleGridKeyDown(e: React.KeyboardEvent) {
    const base = focusedDate ?? value ?? new Date(view.year, view.month, 1);
    let next: Date | null = null;
    if      (e.key === 'ArrowRight') { e.preventDefault(); next = addDays(base, 1); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); next = addDays(base, -1); }
    else if (e.key === 'ArrowDown')  { e.preventDefault(); next = addDays(base, 7); }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); next = addDays(base, -7); }
    else if (e.key === 'Enter' && focusedDate && !isDisabled(focusedDate)) {
      e.preventDefault();
      handleSelect(focusedDate);
      return;
    }
    if (next) {
      setFocusedDate(next);
      if (next.getMonth() !== view.month || next.getFullYear() !== view.year) {
        setView({ year: next.getFullYear(), month: next.getMonth() });
      }
    }
  }

  function nav(delta: number) {
    setView(({ year, month }) => {
      const m = month + delta;
      if (m < 0)  return { year: year - 1, month: 11 };
      if (m > 11) return { year: year + 1, month: 0 };
      return { year, month: m };
    });
  }

  const tabFocusDate = focusedDate ?? value;
  const days = buildMonthGrid(view.year, view.month, weekStartsOn);
  const weekdays = weekdayLabels ?? (weekStartsOn === 1
    ? PT_WEEKDAYS_MON_FIRST
    : ['D', ...PT_WEEKDAYS_MON_FIRST.slice(0, 6)]);
  const today = startOfDay(new Date());
  const formatted = value
    ? value.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  const calendar = (
    <div
      role="dialog"
      aria-label="Calendário"
      className="rounded-(--radius-control) border border-stroke-control bg-surface-default shadow-lg p-3 w-[280px]"
    >
      {/* Header — mês/ano + nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => nav(-1)}
          aria-label="Mês anterior"
          className="p-1 rounded hover:bg-surface-raised text-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-label font-semibold text-fg-primary">
          {PT_MONTHS[view.month]} {view.year}
        </span>
        <button
          type="button"
          onClick={() => nav(1)}
          aria-label="Próximo mês"
          className="p-1 rounded hover:bg-surface-raised text-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((w, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-fg-muted uppercase">
            {w}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div role="grid" className="grid grid-cols-7 gap-1" onKeyDown={handleGridKeyDown}>
        {days.map((d, i) => {
          const inMonth    = d.getMonth() === view.month;
          const isToday    = isSameDay(d, today);
          const isSelected = !!value && isSameDay(d, value);
          const isFocused  = !!tabFocusDate && isSameDay(d, tabFocusDate);
          const dis        = isDisabled(d);
          return (
            <button
              key={i}
              ref={isFocused ? activeDayRef : undefined}
              type="button"
              role="gridcell"
              onClick={() => handleSelect(d)}
              disabled={dis}
              aria-selected={isSelected}
              aria-label={d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              tabIndex={isFocused ? 0 : -1}
              className={[
                'h-8 rounded text-caption font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus',
                'disabled:cursor-not-allowed disabled:opacity-30',
                isSelected
                  ? 'bg-brand-primary text-brand-on-primary'
                  : isToday
                    ? 'border border-stroke-focus text-fg-primary hover:bg-surface-raised'
                    : inMonth
                      ? 'text-fg-primary hover:bg-surface-raised'
                      : 'text-fg-disabled hover:bg-surface-raised',
              ].join(' ')}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Sem label, className segue no container de hoje (retrocompatível); com label,
  // migra pro wrapper externo e o controle preserva o layout relativo de hoje.
  const control = (
    <div className={['relative', width === 'full' ? 'block w-full' : 'inline-block', label ? '' : className].join(' ')}>
      <Popover
        trigger={
          <button
            ref={triggerRef}
            id={triggerId}
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!disabled) setOpen(o => !o); }}
            disabled={disabled}
            aria-label={ariaLabel ?? 'Selecionar data'}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={[
              'w-full flex items-center gap-2 rounded-(--radius-control) border border-stroke-control bg-surface-default',
              'transition-colors focus:outline-none focus:border-stroke-focus focus:ring-2 focus:ring-stroke-focus/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              value ? 'pr-7' : '',
              SIZE_CLASS[size],
            ].join(' ')}
          >
            <Calendar size={16} className="text-fg-muted shrink-0" />
            <span className={['flex-1 text-left truncate', value ? 'text-fg-primary' : 'text-fg-placeholder'].join(' ')}>
              {formatted || placeholder}
            </span>
          </button>
        }
        triggerClassName={width === 'full' ? 'block w-full' : 'inline-block'}
        placement="bottom-start"
        offset={4}
        open={open}
        onOpenChange={(v) => { if (!disabled) setOpen(v); }}
      >
        {() => calendar}
      </Popover>
      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpar data"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary p-0.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );

  if (!label) return control;

  return (
    <div className={['flex flex-col gap-1.5', width === 'full' ? 'w-full' : 'inline-flex', className].join(' ')}>
      <label htmlFor={triggerId} className="text-label font-medium text-fg-primary">{label}</label>
      {control}
    </div>
  );
});
