'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';

/**
 * Slider — input range single (sem range duplo). Inspirado em M3 Slider.
 *
 * Uso:
 *   <Slider value={vol} onChange={setVol} min={0} max={100} />
 *   <Slider value={qty} onChange={setQty} min={1} max={50} step={1} showValue />
 *   <Slider value={pct} onChange={setPct} formatValue={v => `${v}%`} showValue />
 *
 * Sem range duplo por enquanto (M3 e shadcn separam em RangeSlider). Adicionar
 * componente próprio quando precisar.
 */

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value' | 'size'> {
  value:        number;
  onChange:     (value: number) => void;
  min?:         number;
  max?:         number;
  step?:        number;
  /** Mostra valor atual à direita. */
  showValue?:   boolean;
  /** Formata valor (ex: `v => `R$ ${v}``). */
  formatValue?: (value: number) => string;
  /** Mostra ticks min/max abaixo. */
  showRange?:   boolean;
  size?:        'sm' | 'md';
  className?:   string;
}

const TRACK_HEIGHT = { sm: 4, md: 6 };
const THUMB_SIZE   = { sm: 14, md: 18 };

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    showValue = false,
    formatValue,
    showRange = false,
    size = 'md',
    disabled,
    className = '',
    ...rest
  },
  ref,
) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  const fmt = formatValue ?? ((v: number) => String(v));

  return (
    <div className={['flex flex-col gap-2', className].join(' ')}>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 flex items-center" style={{ height: THUMB_SIZE[size] }}>
          <input
            ref={ref}
            id={id}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={e => onChange(Number(e.target.value))}
            className={[
              'rojao-slider absolute inset-0 w-full bg-transparent appearance-none cursor-pointer',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2 focus-visible:rounded-full',
              'disabled:cursor-not-allowed disabled:opacity-50',
            ].join(' ')}
            style={{
              ['--rojao-slider-pct' as string]: `${pct}%`,
              ['--rojao-slider-track-h' as string]: `${TRACK_HEIGHT[size]}px`,
              ['--rojao-slider-thumb-size' as string]: `${THUMB_SIZE[size]}px`,
            }}
            {...rest}
          />
          {/* Track visual (clicks passam pro input acima via z-index) */}
          <div
            aria-hidden
            className="absolute inset-x-0 rounded-full bg-stroke-default pointer-events-none"
            style={{ height: TRACK_HEIGHT[size] }}
          />
          {/* Fill */}
          <div
            aria-hidden
            className="absolute left-0 rounded-full bg-brand-primary pointer-events-none"
            style={{ height: TRACK_HEIGHT[size], width: `${pct}%` }}
          />
        </div>
        {showValue && (
          <span className="text-label font-medium text-fg-primary tabular-nums shrink-0 min-w-[3ch] text-right">
            {fmt(value)}
          </span>
        )}
      </div>
      {showRange && (
        <div className="flex justify-between text-[11px] font-mono text-fg-muted">
          <span>{fmt(min)}</span>
          <span>{fmt(max)}</span>
        </div>
      )}
    </div>
  );
});
