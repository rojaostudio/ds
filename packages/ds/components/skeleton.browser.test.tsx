import { afterEach, describe, expect, it } from 'vitest';
import { Skeleton } from './skeleton';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('Skeleton (%s)', (mode) => {
  it('the three shapes are hidden from assistive tech inside a busy region, and pass axe', async () => {
    const el = await render(
      <div aria-busy="true" style={{ display: 'grid', gap: 8, width: 240 }}>
        <span className="rds-visually-hidden">Carregando…</span>
        <Skeleton shape="circle" />
        <Skeleton />
        <Skeleton width="60%" />
        <Skeleton shape="rect" />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
    const shapes = [...el.querySelectorAll<HTMLElement>('.rds-skeleton')];
    shapes.forEach((s) => expect(s.getAttribute('aria-hidden')).toBe('true'));
    const [circle, line, short, rect] = shapes.map((s) => s.getBoundingClientRect());
    expect([circle.width, circle.height]).toEqual([40, 40]);
    expect([line.width, line.height]).toEqual([240, 16]);
    expect(short.width).toBe(144);
    expect(rect.height).toBe(120);
  });
});
