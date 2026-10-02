import { afterEach, describe, expect, it } from 'vitest';
import { Sparkline } from './sparkline';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('Sparkline (%s)', (mode) => {
  it('with and without the comparison is hidden from assistive tech and passes axe', async () => {
    const el = await render(
      <div style={{ width: 240 }}>
        <p>
          Pedidos: 128 <span>(subiu 24% na semana)</span>
        </p>
        <Sparkline data={[3, 5, 4, 8, 7, 10, 12]} previous={[2, 3, 3, 4, 5, 5, 6]} />
        <Sparkline data={[5, 4, 6]} height={24} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
    const [withPrevious, plain] = el.querySelectorAll('.rds-sparkline');
    expect(withPrevious.getAttribute('aria-hidden')).toBe('true');
    expect(withPrevious.querySelector('.rds-sparkline__previous')).not.toBeNull();
    expect(plain.querySelector('.rds-sparkline__previous')).toBeNull();
    expect(plain.getBoundingClientRect().height).toBe(24);
  });

  it('the dot marks the last value, at the top when it is the highest', async () => {
    const el = await render(<Sparkline data={[1, 2, 3]} />, mode);
    const dot = el.querySelector<HTMLElement>('.rds-sparkline__dot')!;
    expect(dot.style.left).toBe('100%');
    expect(dot.style.top).toBe('0%');
  });
});
