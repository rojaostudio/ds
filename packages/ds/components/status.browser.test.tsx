import { afterEach, describe, expect, it } from 'vitest';
import { Status, type StatusTone, type StatusVariant } from './status';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const TONES: StatusTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];
const VARIANTS: StatusVariant[] = ['outline', 'soft', 'fill'];

describe.each(MODES)('Status (%s)', (mode) => {
  it('every tone × variant × size passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8 }}>
        {VARIANTS.map((variant) => (
          <div key={variant} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TONES.flatMap((tone) => [
              <Status key={tone} tone={tone} variant={variant}>Em análise</Status>,
              <Status key={`${tone}-sm`} tone={tone} variant={variant} size="sm">Em análise</Status>,
            ])}
          </div>
        ))}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  // text/on/info is black on blue/500 in the Figma (it was white, 3.12:1).
  it('info fill passes axe', async () => {
    const el = await render(<Status tone="info" variant="fill">Em análise</Status>, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Status behaviour', () => {
  it('is 32 tall by default and 24 in sm, in every variant; the dot is hidden from screen readers', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        {VARIANTS.map((v) => <Status key={v} variant={v}>Pendente</Status>)}
        {VARIANTS.map((v) => <Status key={`${v}-sm`} variant={v} size="sm">Pendente</Status>)}
      </div>,
    );
    const pills = [...el.querySelectorAll<HTMLElement>('.rds-status')];
    expect(pills.slice(0, 3).map((p) => p.getBoundingClientRect().height)).toEqual([32, 32, 32]);
    expect(pills.slice(3).map((p) => p.getBoundingClientRect().height)).toEqual([24, 24, 24]);
    expect(el.querySelector('.rds-status__dot')!.getAttribute('aria-hidden')).toBe('true');
    expect(pills[0].textContent).toBe('Pendente');
  });

  it('dotColor paints only the dot; the plate and the word stay neutral', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 8 }}>
        <Status>Em produção</Status>
        <Status dotColor="rgb(1, 2, 3)" style={{ marginLeft: 4 }}>Em produção</Status>
      </div>,
    );
    const [plain, custom] = [...el.querySelectorAll<HTMLElement>('.rds-status')];
    const dot = (p: HTMLElement) => getComputedStyle(p.querySelector('.rds-status__dot')!).backgroundColor;
    expect(dot(custom)).toBe('rgb(1, 2, 3)');
    expect(dot(plain)).not.toBe('rgb(1, 2, 3)');
    expect(getComputedStyle(custom).color).toBe(getComputedStyle(plain).color);
    expect(getComputedStyle(custom).backgroundColor).toBe(getComputedStyle(plain).backgroundColor);
    expect(custom.style.marginLeft).toBe('4px');
  });
});
