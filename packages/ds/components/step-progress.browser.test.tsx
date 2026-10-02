import { afterEach, describe, expect, it } from 'vitest';
import { StepProgress } from './step-progress';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('StepProgress (%s)', (mode) => {
  it('every step of 4 passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, width: 320 }}>
        {[1, 2, 3, 4].map((step) => (
          <StepProgress key={step} step={step} total={4} aria-label="Cadastro da empresa" />
        ))}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('StepProgress behaviour', () => {
  it('is a named progressbar that says the step; the fill covers step / total', async () => {
    const el = await render(
      <div style={{ width: 320 }}>
        <StepProgress step={2} total={4} />
      </div>,
    );
    const bar = el.querySelector<HTMLElement>('[role="progressbar"]')!;
    expect(bar.getAttribute('aria-label')).toBe('Progresso');
    expect(bar.getAttribute('aria-valuenow')).toBe('2');
    expect(bar.getAttribute('aria-valuemax')).toBe('4');
    expect(bar.getAttribute('aria-valuetext')).toBe('Passo 2 de 4');
    expect(bar.getBoundingClientRect().height).toBe(6);
    expect(el.querySelector<HTMLElement>('.rds-step-progress__fill')!.getBoundingClientRect().width).toBe(160);
  });
});
