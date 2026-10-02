'use client';

import { useId, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type PointerEvent } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

export type ChartType = 'line' | 'bar' | 'column';

export interface ChartSeries {
  /** The series name, shown in the legend, the tooltip and the data table. */
  name: string;
  /** One value per label, in the same order. */
  data: number[];
  /** line only: which axis it reads on. right only when the two series have different units (volume and rate). */
  axis?: 'left' | 'right';
}

export interface ChartProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** What the chart shows, with the period. It names the chart and captions its data table. */
  label: string;
  /** line: lines over time; bar: a ranking in horizontal bars; column: columns by category. */
  type?: ChartType;
  /** The x labels: dates (line) or categories (bar, column), one per value. */
  labels: string[];
  /**
   * Up to five series, in the order of the palette (chart/series/1 to 5); the main one first. bar draws the first
   * series, one colour per row, as in Figma.
   */
  series: ChartSeries[];
  /** Formats the left axis and its values. By default a compact number in pt-BR ("2,8 mi"). */
  formatLeft?: (value: number) => string;
  /** Formats the right axis and its values. */
  formatRight?: (value: number) => string;
  /** The right axis, for the series with axis="right" (Figma: `showRightAxis`). Off: every series reads on the left. */
  showRightAxis?: boolean;
  /** The legend under the chart (Figma: `showLegend`). Keep it on whenever there is more than one series. */
  showLegend?: boolean;
  /** The values of the point under the pointer or the keyboard (Figma: `showTooltip`). */
  showTooltip?: boolean;
  /** Off: only the first, middle and last label (Figma: `showAllDates`). Use it under about 360 px. */
  showAllDates?: boolean;
  /** Show the data table under the chart. By default it is there only for screen readers. */
  showTable?: boolean;
  /** Height of the plot area, in px (Figma: 200). */
  height?: number;
}

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const defaultFormat = (value: number) => compact.format(value);

/**
 * The colour of a series. The Figma binds the series straight to the theme palette (chart/series/1..5) and has no
 * component token for it (there is no chart/series/* in Content), so the stylesheet cannot name them; the colour
 * reaches the CSS through --_series, set here from the --_series-N locals that chart.css fills with chart/series-color/N.
 */
const seriesStyle = (n: number): CSSProperties => ({ ['--_series' as string]: `var(--_series-${((n - 1) % 5) + 1})` });

/** A round step for about four intervals: 1, 2, 2.5 or 5 times a power of ten. */
function niceStep(raw: number) {
  if (raw <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

/** The axis from zero (or the lowest value, if negative) to a round top, with five ticks. */
function scaleOf(values: number[]) {
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const step = niceStep((high - low) / 4);
  const min = Math.floor(low / step) * step;
  const max = min + step * 4;
  return { min, max, ticks: [4, 3, 2, 1, 0].map((i) => min + step * i) };
}

/**
 * Chart — Figma [RDS] Content/Chart. The chart area, to go inside a Card. Every chart carries a table with the same
 * data (visually hidden unless `showTable`). In line and column the plot is a slider for screen readers and the
 * keyboard: the arrows move from point to point, and each point is read with its label and values. Styles: chart.css.
 */
export function Chart({
  label,
  type = 'line',
  labels,
  series,
  formatLeft = defaultFormat,
  formatRight = defaultFormat,
  showRightAxis = true,
  showLegend = true,
  showTooltip = true,
  showAllDates = true,
  showTable = false,
  height = 200,
  className,
  ...rest
}: ChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const tooltipId = useId();
  const count = labels.length;
  const shown = (type === 'bar' ? series.slice(0, 1) : series.slice(0, 5));
  const onRight = (s: ChartSeries) => type === 'line' && showRightAxis && s.axis === 'right';
  const left = shown.filter((s) => !onRight(s));
  const right = shown.filter(onRight);
  const leftScale = scaleOf(left.flatMap((s) => s.data));
  const rightScale = right.length ? scaleOf(right.flatMap((s) => s.data)) : null;
  const dual = Boolean(rightScale);

  const scaleFor = (s: ChartSeries) => (onRight(s) && rightScale ? rightScale : leftScale);
  const formatFor = (s: ChartSeries) => (onRight(s) ? formatRight : formatLeft);
  // Line points sit on the edges; columns sit in the middle of their band.
  const x = (index: number) =>
    type === 'column' ? ((index + 0.5) / count) * 100 : count > 1 ? (index / (count - 1)) * 100 : 50;
  const y = (s: ChartSeries, value: number) => {
    const { min, max } = scaleFor(s);
    return 100 - ((value - min) / (max - min)) * 100;
  };
  const describe = (index: number) => `${labels[index]}: ` + shown.map((s) => `${s.name} ${formatFor(s)(s.data[index] ?? 0)}`).join(', ');
  const legendName = (s: ChartSeries) => (dual ? `${s.name} (${onRight(s) ? 'direita' : 'esquerda'})` : s.name);
  const labelIndexes = showAllDates || count <= 3 ? labels.map((_, i) => i) : [0, Math.floor((count - 1) / 2), count - 1];

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    setActive(type === 'column' ? Math.min(count - 1, Math.floor(ratio * count)) : Math.round(ratio * (count - 1)));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = active ?? 0;
    const keys: Record<string, number> = {
      ArrowRight: Math.min(count - 1, current + 1),
      ArrowUp: Math.min(count - 1, current + 1),
      ArrowLeft: Math.max(0, current - 1),
      ArrowDown: Math.max(0, current - 1),
      Home: 0,
      End: count - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    setActive(keys[event.key]!);
  };

  const Axis = ({ ticks, format, side }: { ticks: number[]; format: (v: number) => string; side: 'left' | 'right' }) => (
    <div className={`rds-chart__axis rds-chart__axis--${side}`} aria-hidden="true">
      {ticks.map((tick) => (
        <span key={tick}>{format(tick)}</span>
      ))}
    </div>
  );

  const tooltip = active !== null && showTooltip && (
    <div
      id={tooltipId}
      role="tooltip"
      className={`rds-chart__tooltip${x(active) > 50 ? ' rds-chart__tooltip--flip' : ''}`}
      style={x(active) > 50 ? { right: `${100 - x(active)}%` } : { left: `${x(active)}%` }}
    >
      <span className="rds-chart__tooltip-title">{labels[active]}</span>
      {shown.map((s, n) => (
        <span key={s.name} className="rds-chart__tooltip-row">
          <span className="rds-chart__dot" style={seriesStyle(n + 1)} aria-hidden="true" />
          <span className="rds-chart__tooltip-name">{s.name}</span>
          <span className="rds-chart__tooltip-value">{formatFor(s)(s.data[active] ?? 0)}</span>
        </span>
      ))}
    </div>
  );

  const plotProps = {
    className: 'rds-chart__plot',
    role: 'slider' as const,
    tabIndex: 0,
    'aria-label': `Ler ${label.charAt(0).toLowerCase()}${label.slice(1)}`,
    'aria-valuemin': 0,
    'aria-valuemax': Math.max(count - 1, 0),
    'aria-valuenow': active ?? 0,
    'aria-valuetext': count ? describe(active ?? 0) : undefined,
    'aria-describedby': active !== null && showTooltip ? tooltipId : undefined,
    onPointerMove,
    onPointerLeave: (event: PointerEvent<HTMLDivElement>) => {
      if (document.activeElement !== event.currentTarget) setActive(null);
    },
    onFocus: () => setActive((current) => current ?? 0),
    onBlur: () => setActive(null),
    onKeyDown,
  };

  const grid = leftScale.ticks.map((tick, i) => <span key={tick} className="rds-chart__grid" style={{ top: `${i * 25}%` }} />);

  let body;
  if (type === 'bar') {
    const s = shown[0];
    const top = Math.max(0, ...(s?.data ?? [0]));
    body = (
      <div className="rds-chart__bars" aria-hidden="true">
        {labels.map((name, i) => (
          <div key={name} className="rds-chart__bar-row">
            <span className="rds-chart__bar-label">{name}</span>
            <span className="rds-chart__track">
              <span
                className="rds-chart__bar"
                style={{ ...seriesStyle(i + 1), width: `${top ? ((s?.data[i] ?? 0) / top) * 100 : 0}%` }}
              />
            </span>
            <span className="rds-chart__bar-value">{s ? formatLeft(s.data[i] ?? 0) : ''}</span>
          </div>
        ))}
      </div>
    );
  } else {
    body = (
      <>
        <div className="rds-chart__row" style={{ height }}>
          <Axis ticks={leftScale.ticks} format={formatLeft} side="left" />
          <div {...plotProps}>
            {grid}
            {type === 'line' ? (
              <svg className="rds-chart__svg" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false" aria-hidden="true">
                {shown.map((s, n) => (
                  <path
                    key={s.name}
                    className="rds-chart__line"
                    style={seriesStyle(n + 1)}
                    d={s.data.map((value, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)} ${y(s, value).toFixed(2)}`).join(' ')}
                  />
                ))}
              </svg>
            ) : (
              <div className="rds-chart__columns" aria-hidden="true">
                {labels.map((name, i) => (
                  <div key={name} className="rds-chart__column-group">
                    {shown.map((s, n) => (
                      <span
                        key={s.name}
                        className="rds-chart__column"
                        style={{ ...seriesStyle(n + 1), height: `${100 - y(s, s.data[i] ?? 0)}%` }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
            {active !== null && type === 'line' && (
              <>
                <span className="rds-chart__crosshair" style={{ left: `${x(active)}%` }} aria-hidden="true" />
                {shown.map((s, n) => (
                  <span
                    key={s.name}
                    className="rds-chart__point"
                    style={{ ...seriesStyle(n + 1), left: `${x(active)}%`, top: `${y(s, s.data[active] ?? 0)}%` }}
                    aria-hidden="true"
                  />
                ))}
              </>
            )}
            {active !== null && type === 'column' && (
              <span
                className="rds-chart__band"
                style={{ left: `${(active / count) * 100}%`, width: `${100 / count}%` }}
                aria-hidden="true"
              />
            )}
            {tooltip}
          </div>
          {rightScale && <Axis ticks={rightScale.ticks} format={formatRight} side="right" />}
        </div>
        <div className="rds-chart__labels" aria-hidden="true">
          <div className={`rds-chart__labels-track rds-chart__labels-track--${type}`}>
            {labelIndexes.map((i) => (
              <span key={i} className="rds-chart__label" style={{ left: `${x(i)}%` }}>
                {labels[i]}
              </span>
            ))}
          </div>
        </div>
      </>
    );
  }

  const firstColumn = type === 'line' ? 'Data' : 'Categoria';
  return (
    <figure
      {...rest}
      aria-label={label}
      className={['rds-chart', `rds-chart--${type}`, dual && 'rds-chart--dual', className].filter(Boolean).join(' ')}
    >
      {body}
      {showLegend && type !== 'bar' && (
        <ul className="rds-chart__legend" aria-hidden="true">
          {shown.map((s, n) => (
            <li key={s.name}>
              <span className="rds-chart__dot" style={seriesStyle(n + 1)} />
              {legendName(s)}
            </li>
          ))}
        </ul>
      )}
      {showTable ? (
        <Table caption={label} showCaption className="rds-chart__table">
          <TableHeader>
            <TableRow>
              <TableHead>{firstColumn}</TableHead>
              {shown.map((s) => (
                <TableHead key={s.name} align="end">
                  {legendName(s)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {labels.map((name, i) => (
              <TableRow key={name}>
                <TableCell>{name}</TableCell>
                {shown.map((s) => (
                  <TableCell key={s.name} align="end">
                    {formatFor(s)(s.data[i] ?? 0)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        // The clip goes on a wrapper: a <table> ignores the 1px box and overflow of .rds-visually-hidden, so it
        // kept its full size, anchored to the page and stretched the page scroll.
        <div className="rds-visually-hidden">
          <table>
            <caption>{label}</caption>
            <thead>
              <tr>
                <th scope="col">{firstColumn}</th>
                {shown.map((s) => (
                  <th key={s.name} scope="col">
                    {legendName(s)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((name, i) => (
                <tr key={name}>
                  <th scope="row">{name}</th>
                  {shown.map((s) => (
                    <td key={s.name}>{formatFor(s)(s.data[i] ?? 0)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
