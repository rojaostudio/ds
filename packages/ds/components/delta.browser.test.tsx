import { afterEach, describe, expect, it } from 'vitest';
import { Delta, type DeltaDirection, type DeltaTone } from './delta';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const DIRECTIONS: DeltaDirection[] = ['up', 'down', 'flat'];
const TONES: DeltaTone[] = ['neutral', 'success', 'danger'];

describe.each(MODES)('Delta (%s)', (mode) => {
  it('every direction × tone passes axe', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {DIRECTIONS.flatMap((direction) =>
          TONES.map((tone) => (
            <Delta key={`${direction}-${tone}`} direction={direction} tone={tone}>
              24%
            </Delta>
          )),
        )}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Delta behaviour', () => {
  it('says the direction in words before the value; the arrow is hidden', async () => {
    const el = await render(
      <div>
        <Delta direction="down" tone="success">3,5 pp</Delta>
        <Delta direction="up" srPrefix="Subiu em relação a agosto:">24%</Delta>
      </div>,
    );
    const [down, up] = el.querySelectorAll<HTMLElement>('.rds-delta');
    expect(down.textContent).toBe('Caiu 3,5 pp');
    expect(up.textContent).toBe('Subiu em relação a agosto: 24%');
    expect(down.querySelector('.rds-delta__icon')!.getAttribute('aria-hidden')).toBe('true');
  });
});
