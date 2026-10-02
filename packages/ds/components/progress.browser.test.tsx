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
