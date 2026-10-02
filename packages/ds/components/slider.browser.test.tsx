import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Slider } from './slider';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const percent = (v: number) => `${v}%`;

describe.each(MODES)('Slider (%s)', (mode) => {
  it('default, without value, without label and disabled pass axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 24, maxWidth: 320 }}>
        <Slider label="Volume por dia" defaultValue={75} formatValue={percent} />
        <Slider label="Volume por dia" defaultValue={40} showValue={false} />
        <Slider aria-label="Volume por dia" defaultValue={20} showValue={false} />
        <Slider label="Volume por dia" defaultValue={60} disabled formatValue={percent} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('is 48 tall in the Figma (20 + 8 + 20), with a 44 touch area', async () => {
    const el = await render(<Slider label="Volume" defaultValue={50} />, mode);
    expect(el.querySelector<HTMLElement>('.rds-slider')!.getBoundingClientRect().height).toBe(48);
    expect(el.querySelector('input')!.getBoundingClientRect().height).toBe(44);
  });
});

describe('Slider behaviour', () => {
  it('a native range named by the label, its number read through aria-valuetext', async () => {
    const el = await render(<Slider label="Volume por dia" defaultValue={75} formatValue={percent} />);
    const slider = el.querySelector('input')!;
    expect(slider.type).toBe('range');
    expect(slider.labels?.[0]?.textContent).toBe('Volume por dia');
    expect(slider.getAttribute('aria-valuetext')).toBe('75%');
    expect(el.querySelector('.rds-slider__value')?.textContent).toBe('75%');
  });

  it('the arrows move a step; Home and End go to the ends', async () => {
    const onValueChange = vi.fn();
    const el = await render(<Slider label="Volume" defaultValue={50} onValueChange={onValueChange} formatValue={percent} />);
    const slider = el.querySelector('input')!;
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith(55);
    expect(slider.getAttribute('aria-valuetext')).toBe('55%');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(onValueChange).toHaveBeenLastCalledWith(45);
    await userEvent.keyboard('{Home}');
    expect(onValueChange).toHaveBeenLastCalledWith(0);
    await userEvent.keyboard('{End}');
    expect(onValueChange).toHaveBeenLastCalledWith(100);
    expect(el.querySelector('.rds-slider__value')?.textContent).toBe('100%');
  });

  it('disabled is the native one', async () => {
    const el = await render(<Slider label="Volume" disabled />);
    expect(el.querySelector('input')!.disabled).toBe(true);
  });
});
