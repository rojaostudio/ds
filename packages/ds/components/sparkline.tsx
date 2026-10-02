import type { HTMLAttributes } from 'react';

export interface SparklineProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The series, oldest first. The dot marks the last value. */
  data: number[];
  /** The previous period, drawn dashed behind (Figma: `comparison=true`). Same length as `data` reads best. */
  previous?: number[];
  /** Height in px. The width follows the container. */
  height?: number;
}

type Point = { x: number; y: number };

/** Points of a series as percentages of the box (0 at the bottom), on a scale shared by current and previous. */
function toPoints(values: number[], min: number, max: number, length: number): Point[] {
  const span = max - min || 1;
  const step = length > 1 ? 100 / (length - 1) : 0;
  return values.map((value, index) => ({ x: index * step, y: 100 - ((value - min) / span) * 100 }));
}

const path = (points: Point[]) => points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

/**
 * Sparkline — Figma [RDS] Content/Sparkline. The shape of a series in the space of a line, no axes: the trend beside
 * a number. Always aria-hidden: the trend goes into the number's text or a Delta ("subiu 24% na semana").
 * Styles: sparkline.css.
 */
export function Sparkline({ data, previous, height = 32, className, style, ...rest }: SparklineProps) {
  const all = previous ? [...data, ...previous] : data;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const length = Math.max(data.length, previous?.length ?? 0);
  const current = toPoints(data, min, max, length);
  const last = current[current.length - 1];
  return (
    <div aria-hidden="true" {...rest} className={['rds-sparkline', className].filter(Boolean).join(' ')} style={{ height, ...style }}>
      <div className="rds-sparkline__area">
        <svg className="rds-sparkline__svg" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
          {previous && <path className="rds-sparkline__previous" d={path(toPoints(previous, min, max, length))} />}
          <path className="rds-sparkline__line" d={path(current)} />
        </svg>
        {last && <span className="rds-sparkline__dot" style={{ left: `${last.x}%`, top: `${last.y}%` }} />}
      </div>
    </div>
  );
}
