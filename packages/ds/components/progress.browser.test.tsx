import { afterEach, describe, expect, it } from 'vitest';
import { Progress } from './progress';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('Progress (%s)', (mode) => {
  it('every size, with and without label and value, task and measure, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 320 }}>
        <Progress value={0} label="Importando contatos" />
        <Progress value={45} label="Importando contatos" />
        <Progress value={100} label="Importando contatos" size="sm" />
        <Progress value={75} label="Envios usados" kind="measure" valueText="750 de 1.000" />
        <Progress value={30} label="Importando contatos" showLabel={false} />
        <Progress value={30} label="Importando contatos" showLabel={false} showValue={false} size="sm" />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('every tone passes axe; the tone fill keeps 3:1 against the track', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 320 }}>
        {TONES.map((tone) => (
          <Progress key={tone} value={80} label={`Envios usados (${tone})`} kind="measure" tone={tone} />
        ))}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
    for (const progress of el.querySelectorAll<HTMLElement>('.rds-progress')) {
      const track = getComputedStyle(progress.querySelector('.rds-progress__track')!).backgroundColor;
      const fill = getComputedStyle(progress.querySelector('.rds-progress__fill')!).backgroundColor;
      expect(contrast(fill, track)).toBeGreaterThanOrEqual(3);
    }
  });
});

const TONES = ['success', 'warning', 'danger'] as const;

/** A CSS colour as sRGB 0-255, read back from a canvas pixel. */
function rgb(css: string): [number, number, number] {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}
const luminance = ([r, g, b]: [number, number, number]) => {
  const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(rgb(a)), luminance(rgb(b))].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

describe('Progress tone', () => {
  it('neutral by default (progress/fill); a tone changes only the fill, the track stays', async () => {
    const el = await render(
      <div style={{ width: 320 }}>
        <Progress value={50} label="Neutro" />
        {TONES.map((tone) => (
          <Progress key={tone} value={50} label={tone} tone={tone} />
        ))}
      </div>,
    );
    const progresses = [...el.querySelectorAll<HTMLElement>('.rds-progress')];
    const probe = (v: string) => {
      const span = document.createElement('span');
      el.append(span);
      span.style.color = `var(${v})`;
      const c = getComputedStyle(span).color;
      span.remove();
      return c;
    };
    const fill = (p: HTMLElement) => getComputedStyle(p.querySelector('.rds-progress__fill')!).backgroundColor;
    const track = (p: HTMLElement) => getComputedStyle(p.querySelector('.rds-progress__track')!).backgroundColor;
    expect(progresses[0].className).toBe('rds-progress rds-progress--md');
    expect(fill(progresses[0])).toBe(probe('--progress-fill'));
    TONES.forEach((tone, i) => {
      const p = progresses[i + 1];
      expect(p.classList).toContain(`rds-progress--${tone}`);
      expect(fill(p)).toBe(probe(`--progress-fill-${tone}`));
      expect(track(p)).toBe(track(progresses[0]));
    });
    expect(new Set(progresses.map(fill)).size).toBe(4);
  });
});

describe('Progress behaviour', () => {
  it('is a progressbar with aria-valuenow, min, max and text, named by its label', async () => {
    const el = await render(<Progress value={45} label="Importando contatos" />);
    const bar = el.querySelector<HTMLElement>('[role="progressbar"]')!;
    expect(bar.getAttribute('aria-valuenow')).toBe('45');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-valuetext')).toBe('45%');
    expect(document.getElementById(bar.getAttribute('aria-labelledby')!)?.textContent).toBe('Importando contatos');
    expect(el.querySelector<HTMLElement>('.rds-progress__fill')!.style.width).toBe('45%');
  });

  it('measure is a meter; a hidden label still names it; the value is clamped', async () => {
    const el = await render(
      <div>
        <Progress value={1200} max={1000} label="Envios usados" kind="measure" showLabel={false} />
      </div>,
    );
    const meter = el.querySelector<HTMLElement>('[role="meter"]')!;
    expect(meter.getAttribute('aria-label')).toBe('Envios usados');
    expect(meter.getAttribute('aria-valuenow')).toBe('1000');
  });

  it('the bar is 8 tall, 4 in sm', async () => {
    const el = await render(
      <div style={{ width: 320 }}>
        <Progress value={50} label="A" />
        <Progress value={50} label="B" size="sm" />
      </div>,
    );
    const tracks = el.querySelectorAll<HTMLElement>('.rds-progress__track');
    expect(tracks[0].getBoundingClientRect().height).toBe(8);
    expect(tracks[1].getBoundingClientRect().height).toBe(4);
  });
});
