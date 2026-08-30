'use client';

import { forwardRef, useState, useRef, useEffect, useImperativeHandle } from 'react';
import { Clock, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Popover } from './popover';

/**
 * TimePicker — input de hora (HH:mm) com popover de seletor.
 *
 * Uso:
 *   <TimePicker value="09:30" onChange={setTime} />
 *   <TimePicker value={null} onChange={setTime} step={15} />     // múltiplos de 15min
 *   <TimePicker value="14:00" onChange={setTime} format="12h" />
 *
 * Valor é string "HH:mm" (24h) ou null. Lib calling code converte se precisar Date.
 * Confirma via botão "OK". ESC e clique fora descartam o rascunho.
 */

export interface TimePickerProps {
  value:        string | null;       // "HH:mm" 24h
  onChange:     (time: string | null) => void;
  /** Step de minutos. default = 1. Use 5/15/30 pra agendamentos. */
  step?:        number;
  /** Formato exibido. default = '24h'. */
  format?:      '24h' | '12h';
  placeholder?: string;
  size?:        'sm' | 'md';
  width?:       'full' | 'hug';
  disabled?:    boolean;
  /** Hora mínima permitida ("HH:mm"). */
  min?:         string;
  /** Hora máxima permitida ("HH:mm"). */
  max?:         string;
  className?:   string;
  'aria-label'?: string;
}

const SIZE_CLASS = {
  sm: 'h-8 text-caption px-2.5',
  md: 'h-10 text-label px-3',
} as const;

function parseTime(t: string | null): { h: number; m: number } | null {
  if (!t) return null;
  const match = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1]!, 10);
  const m = parseInt(match[2]!, 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

function formatTime(h: number, m: number, format: '24h' | '12h'): string {
  const mm = String(m).padStart(2, '0');
  if (format === '24h') return `${String(h).padStart(2, '0')}:${mm}`;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, '0')}:${mm} ${period}`;
}

function clampMinute(m: number, step: number): number {
  return Math.round(m / step) * step % 60;
}

function compareTime(a: string, b: string): number {
  const pa = parseTime(a)!;
  const pb = parseTime(b)!;
  return (pa.h * 60 + pa.m) - (pb.h * 60 + pb.m);
}

export const TimePicker = forwardRef<HTMLButtonElement, TimePickerProps>(function TimePicker({
  value,
  onChange,
  step = 1,
  format = '24h',
  placeholder = 'HH:mm',
  size = 'md',
  width = 'full',
  disabled = false,
  min,
  max,
  className = '',
  'aria-label': ariaLabel,
}, ref) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ h: number; m: number }>(() => {
    const p = parseTime(value);
    return p ?? { h: 9, m: 0 };
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  // draft ref para evitar stale closure no commit chamado de fora do render cycle
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useImperativeHandle(ref, () => triggerRef.current!);

  // Sincroniza draft com value quando abre
  useEffect(() => {
    if (open) {
      const p = parseTime(value);
      if (p) setDraft(p);
    }
  }, [open, value]);

  function commit() {
    const d = draftRef.current;
    const t = `${String(d.h).padStart(2, '0')}:${String(d.m).padStart(2, '0')}`;
    if (min && compareTime(t, min) < 0) return;
    if (max && compareTime(t, max) > 0) return;
    onChange(t);
  }

  function adjust(field: 'h' | 'm', delta: number) {
    setDraft(d => {
      if (field === 'h') {
        let h = d.h + delta;
        if (h < 0) h = 23;
        if (h > 23) h = 0;
        return { ...d, h };
      }
      let m = d.m + delta * step;
      if (m < 0) m = 60 - step;
      if (m >= 60) m = 0;
      return { ...d, m: clampMinute(m, step) };
    });
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    triggerRef.current?.focus();
  }

  const display = (() => {
    const p = parseTime(value);
    if (!p) return '';
    return formatTime(p.h, p.m, format);
  })();

  const dialog = (
    <div
      role="dialog"
      aria-label="Seletor de hora"
      className="rounded-(--radius-control) border border-stroke-default bg-surface-default shadow-lg p-3"
    >
      <div className="flex items-center gap-2">
        <Spinner
          label="Hora"
          value={String(draft.h).padStart(2, '0')}
          onUp={() => adjust('h', 1)}
          onDown={() => adjust('h', -1)}
        />
        <span className="text-heading-sm font-semibold text-fg-muted">:</span>
        <Spinner
          label="Minuto"
          value={String(draft.m).padStart(2, '0')}
          onUp={() => adjust('m', 1)}
          onDown={() => adjust('m', -1)}
        />
        {format === '12h' && (
          <span className="text-caption font-medium text-fg-secondary ml-1">
            {draft.h >= 12 ? 'PM' : 'AM'}
          </span>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-caption text-fg-muted hover:text-fg-primary transition-colors px-2 py-1"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => { commit(); setOpen(false); }}
          className="text-caption font-medium bg-brand-primary text-brand-on-primary px-3 py-1 rounded transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
        >
          OK
        </button>
      </div>
    </div>
  );

  return (
    <div className={['relative', width === 'full' ? 'block w-full' : 'inline-block', className].join(' ')}>
      <Popover
        trigger={
          <button
            ref={triggerRef}
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!disabled) setOpen(o => !o); }}
            disabled={disabled}
            aria-label={ariaLabel ?? 'Selecionar hora'}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={[
              'w-full flex items-center gap-2 rounded-(--radius-control) border border-stroke-default bg-surface-default',
              'transition-colors focus:outline-none focus:border-stroke-focus focus:ring-2 focus:ring-stroke-focus/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              value ? 'pr-7' : '',
              SIZE_CLASS[size],
            ].join(' ')}
          >
            <Clock size={16} className="text-fg-muted shrink-0" />
            <span className={['flex-1 text-left truncate', display ? 'text-fg-primary' : 'text-fg-placeholder'].join(' ')}>
              {display || placeholder}
            </span>
          </button>
        }
        triggerClassName={width === 'full' ? 'block w-full' : 'inline-block'}
        placement="bottom-start"
        offset={4}
        open={open}
        onOpenChange={(v) => { if (!disabled) setOpen(v); }}
      >
        {() => dialog}
      </Popover>
      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpar hora"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary p-0.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
});

function Spinner({ label, value, onUp, onDown }: { label: string; value: string; onUp: () => void; onDown: () => void }) {
  return (
    <div className="flex flex-col items-center" role="group" aria-label={label}>
      <button
        type="button"
        onClick={onUp}
        aria-label={`Aumentar ${label.toLowerCase()}`}
        className="p-0.5 rounded hover:bg-surface-raised text-fg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stroke-focus"
      >
        <ChevronUp size={16} />
      </button>
      <div className="px-2 py-1 text-heading-lg font-mono font-semibold text-fg-primary tabular-nums select-none min-w-[3ch] text-center">
        {value}
      </div>
      <button
        type="button"
        onClick={onDown}
        aria-label={`Diminuir ${label.toLowerCase()}`}
        className="p-0.5 rounded hover:bg-surface-raised text-fg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stroke-focus"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}
