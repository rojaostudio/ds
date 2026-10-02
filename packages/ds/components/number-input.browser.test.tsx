import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { userEvent } from 'vitest/browser';
import { NumberInput } from './number-input';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// The [RDS] maps number-input/label/color to text/heading, and the rojao light heading is flare-700 (#ff6a00,
// 2.9:1 on white) for a 14px label. Kept out of the light axe matrix and pinned below until the Figma decides.
const KNOWN_LIGHT_LABEL = (mode: string) => (mode === 'light' ? ['.rds-field__label'] : []);

const field = (el: HTMLElement, i = 0) => el.querySelectorAll<HTMLInputElement>('[role="spinbutton"]')[i];
const minus = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('[aria-label="Diminuir"]')!;
const plus = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('[aria-label="Aumentar"]')!;

describe.each(MODES)('NumberInput (%s)', (mode) => {
  it('every state passes axe: middle, limits, unit, steps, hint, error, required, disabled', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 240 }}>
        <NumberInput label="Quantidade" defaultValue={3} min={1} max={10} />
        <NumberInput label="Quantidade" defaultValue={1} min={1} max={10} hint="De 1 a 10 por pedido." required />
        <NumberInput label="Quantidade" defaultValue={10} min={1} max={10} errorMessage="O máximo é 10 por pedido." />
        <NumberInput label="Tiragem" defaultValue={500} step={500} min={0} unit="un" steps={[500, 1000]} />
        <NumberInput label="Quantidade" defaultValue={3} disabled unit="un" steps={[5, 10]} />
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT_LABEL(mode))).toEqual([]);
  });

  it('one 44 frame: − and + inside it, split by inner borders', async () => {
    const el = await render(<NumberInput label="Quantidade" defaultValue={3} />, mode);
    const box = el.querySelector<HTMLElement>('.rds-field__box')!;
    expect(box.getBoundingClientRect().height).toBe(44);
    expect(box.contains(minus(el))).toBe(true);
    expect(box.contains(plus(el))).toBe(true);
    expect(box.querySelectorAll('.rds-number-input__divider')).toHaveLength(2);
  });
});

describe('NumberInput behaviour', () => {
  it.fails('the top label on the rojao light theme passes axe (text/heading is flare-700)', async () => {
    const el = await render(<NumberInput label="Quantidade" defaultValue={3} />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('a spinbutton named by the label, with aria-valuenow, min and max; − and + stay out of the Tab order', async () => {
    const el = await render(<NumberInput label="Quantidade" defaultValue={3} min={1} max={10} unit="un" />);
    const input = field(el);
    expect(input.labels?.[0]?.textContent).toBe('Quantidade');
    expect(input.getAttribute('aria-valuenow')).toBe('3');
    expect(input.getAttribute('aria-valuemin')).toBe('1');
    expect(input.getAttribute('aria-valuemax')).toBe('10');
    expect(input.getAttribute('aria-valuetext')).toBe('3 un');
    expect(input.inputMode).toBe('numeric');
    expect(minus(el).tabIndex).toBe(-1);
    expect(plus(el).tabIndex).toBe(-1);
    expect(el.textContent).toContain('un');
  });

  it('the arrows move by step, Page Up/Down by ten, Home and End go to the limits', async () => {
    const el = await render(<NumberInput label="Quantidade" defaultValue={3} min={1} max={50} debounce={0} />);
    const input = field(el);
    input.focus();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(input.value).toBe('5');
    await userEvent.keyboard('{ArrowDown}');
    expect(input.value).toBe('4');
    await userEvent.keyboard('{PageUp}');
    expect(input.value).toBe('14');
    await userEvent.keyboard('{End}');
    expect(input.value).toBe('50');
    await userEvent.keyboard('{Home}');
    expect(input.value).toBe('1');
  });

  it('at a limit its button turns off; − and + keep the focus in the field', async () => {
    const el = await render(<NumberInput label="Quantidade" defaultValue={2} min={1} max={3} debounce={0} />);
    const input = field(el);
    await userEvent.click(minus(el));
    expect(input.value).toBe('1');
    expect(minus(el).disabled).toBe(true);
    expect(document.activeElement).toBe(input);
    await userEvent.click(plus(el));
    await userEvent.click(plus(el));
    expect(input.value).toBe('3');
    expect(plus(el).disabled).toBe(true);
  });

  it('the value snaps to the next multiple of step counted from min', async () => {
    const el = await render(<NumberInput label="Tiragem" defaultValue={730} min={0} step={500} debounce={0} />);
    const input = field(el);
    await userEvent.click(plus(el));
    expect(input.value).toBe('1000');
    await userEvent.fill(input, '730');
    await userEvent.keyboard('{ArrowDown}');
    expect(input.value).toBe('500');
  });

  it('typing is confirmed on Enter or blur, clamped to the limits; emptying sends null', async () => {
    const onChange = vi.fn();
    const el = await render(<NumberInput label="Quantidade" defaultValue={3} min={1} max={10} debounce={0} onChange={onChange} />);
    const input = field(el);
    await userEvent.fill(input, '25');
    await userEvent.keyboard('{Enter}');
    expect(input.value).toBe('10');
    expect(onChange).toHaveBeenLastCalledWith(10);
    await userEvent.fill(input, '');
    act(() => input.blur());
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('onChange waits for the debounce: a run of + presses sends one value', async () => {
    vi.useFakeTimers();
    try {
      const onChange = vi.fn();
      const el = await render(<NumberInput label="Quantidade" defaultValue={1} onChange={onChange} />);
      act(() => {
        plus(el).click();
        plus(el).click();
        plus(el).click();
      });
      expect(field(el).value).toBe('4');
      expect(onChange).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(300));
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveBeenCalledWith(4);
    } finally {
      vi.useRealTimers();
    }
  });

  it('named steps are FilterChips: the one equal to the value is on; pressing one sets it', async () => {
    const onChange = vi.fn();
    const el = await render(
      <NumberInput label="Tiragem" defaultValue={500} min={0} step={500} unit="un" steps={[500, { value: 1000, label: 'Mil' }]} debounce={0} onChange={onChange} />,
    );
    const group = el.querySelector('[role="group"][aria-label="Valores sugeridos"]')!;
    const [five, mil] = Array.from(group.querySelectorAll('button'));
    expect(five.textContent).toBe('500 un');
    expect(five.getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(mil);
    expect(field(el).value).toBe('1000');
    expect(onChange).toHaveBeenLastCalledWith(1000);
    expect(mil.getAttribute('aria-pressed')).toBe('true');
  });

  it('decimals read with a comma; hint, error and required as in the Input', async () => {
    const el = await render(
      <>
        <NumberInput label="Peso" defaultValue={1.5} step={0.5} unit="kg" hint="Em quilos." required name="peso" />
        <NumberInput label="Quantidade" errorMessage="O máximo é 10 por pedido." />
      </>,
    );
    const [weight, wrong] = [field(el, 0), field(el, 1)];
    expect(weight.value).toBe('1,5');
    expect(weight.inputMode).toBe('decimal');
    expect(weight.getAttribute('aria-required')).toBe('true');
    expect(document.getElementById(weight.getAttribute('aria-describedby')!)?.textContent).toBe('Em quilos.');
    expect(el.querySelector<HTMLInputElement>('input[name="peso"]')!.value).toBe('1.5');
    expect(wrong.getAttribute('aria-invalid')).toBe('true');
  });
});
