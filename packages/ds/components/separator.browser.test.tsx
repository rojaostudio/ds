import { afterEach, describe, expect, it } from 'vitest';
import { Separator } from './separator';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

describe.each(MODES)('Separator (%s)', (mode) => {
  it('is hidden from assistive tech when decorative (default)', async () => {
    const el = await render(<Separator />, mode);
    const line = el.querySelector('.rds-separator')!;
    expect(line.getAttribute('role')).toBe('none');
    expect(line.getAttribute('aria-hidden')).toBe('true');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('is announced as a separator when it splits sections', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 8 }}>
        <span>Before</span>
        <Separator decorative={false} orientation="vertical" />
        <span>After</span>
      </div>,
      mode,
    );
    const line = el.querySelector('[role="separator"]')!;
    expect(line.getAttribute('aria-orientation')).toBe('vertical');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('paints the line with separator/line → border/default, 1px', async () => {
    const el = await render(<Separator />, mode);
    const line = el.querySelector('.rds-separator') as HTMLElement;
    const style = getComputedStyle(line);
    // [RDS] rojao: border/default is zinc/200 in light and zinc/800 in dark.
    expect(style.backgroundColor).toBe(rgb(mode === 'light' ? '#e4e4e7' : '#27272a'));
    expect(style.height).toBe('1px');
  });
});
