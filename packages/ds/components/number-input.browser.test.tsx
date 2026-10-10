import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { cdp, userEvent } from 'vitest/browser';
import { NumberInput } from './number-input';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

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
    expect(await axeViolations(el)).toEqual([]);
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
  it('the top label on the rojao light theme passes axe', async () => {
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

describe('NumberInput size sm', () => {
  const touch = (enabled: boolean) => cdp().send('Emulation.setTouchEmulationEnabled', { enabled, maxTouchPoints: 1 });
  afterEach(async () => {
    await touch(false);
  });

  it('a 32 frame that hugs its content: − and + 32 wide, the number at least 32 and growing with its digits', async () => {
    const el = await render(
      <div style={{ width: 400, display: 'grid', gap: 16 }}>
        <NumberInput size="sm" label="Quantidade" defaultValue={3} />
        <NumberInput size="sm" label="Quantidade" defaultValue={12345} />
        <NumberInput label="Quantidade" defaultValue={3} />
      </div>,
    );
    const [one, five, md] = Array.from(el.querySelectorAll<HTMLElement>('.rds-field__box'));
    const b = one!.getBoundingClientRect();
    expect(b.height).toBe(32);
    expect(b.width).toBeLessThan(120);
    const [dec, inc] = Array.from(one!.querySelectorAll<HTMLElement>('.rds-field__action'));
    expect(dec!.getBoundingClientRect().width).toBe(32);
    expect(inc!.getBoundingClientRect().width).toBe(32);
    const value = one!.querySelector<HTMLElement>('.rds-number-input__value')!.getBoundingClientRect();
    expect(value.width).toBeGreaterThanOrEqual(32);
    const wide = five!.querySelector<HTMLElement>('.rds-number-input__value')!.getBoundingClientRect();
    expect(wide.width).toBeGreaterThan(value.width);
    expect(five!.getBoundingClientRect().width).toBeGreaterThan(b.width);
    expect(five!.getBoundingClientRect().height).toBe(32);
    // md stays the 44 frame across its column.
    expect(md!.getBoundingClientRect().height).toBe(44);
    expect(md!.getBoundingClientRect().width).toBe(400);
  });

  it('the label is visually hidden and still names the spinbutton', async () => {
    const el = await render(<NumberInput size="sm" label="Quantidade" defaultValue={3} />);
    const input = field(el)!;
    const label = input.labels![0]!;
    expect(label.textContent).toBe('Quantidade');
    expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    // The frame is the first thing seen: no room taken above it.
    expect(el.querySelector<HTMLElement>('.rds-field__box')!.getBoundingClientRect().top).toBe(
      el.querySelector<HTMLElement>('.rds-field')!.getBoundingClientRect().top,
    );
  });

  it.each(MODES)('sm, with and without the bin, passes axe (%s)', async (mode) => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16 }}>
        <NumberInput size="sm" label="Quantidade" defaultValue={3} min={1} max={10} />
        <NumberInput size="sm" label="Quantidade" defaultValue={1} min={1} onRemove={() => {}} />
        <NumberInput label="Quantidade" defaultValue={1} min={1} onRemove={() => {}} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('with a fine pointer, − and + take only their own 32', async () => {
    const el = await render(
      <div style={{ padding: 40 }}>
        <NumberInput size="sm" label="Quantidade" defaultValue={3} />
      </div>,
    );
    const d = minus(el).getBoundingClientRect();
    expect(document.elementFromPoint(d.left - 4, d.top + d.height / 2)).not.toBe(minus(el));
  });

  it('with a coarse pointer, − and + reach 44 × 44, growing outwards and never over the number', async () => {
    await touch(true);
    const el = await render(
      <div style={{ padding: 40 }}>
        <NumberInput size="sm" label="Quantidade" defaultValue={3} />
      </div>,
    );
    expect(matchMedia('(pointer: coarse)').matches).toBe(true);
    const dec = minus(el);
    const inc = plus(el);
    const box = el.querySelector<HTMLElement>('.rds-field__box')!.getBoundingClientRect();
    expect(box.height).toBe(32);
    const d = dec.getBoundingClientRect();
    const i = inc.getBoundingClientRect();
    const midY = d.top + d.height / 2;
    // −: 12 to the left of its own edge, 7 above and below (44 × 44).
    expect(document.elementFromPoint(d.left - 11, midY)).toBe(dec);
    expect(document.elementFromPoint(d.left - 13, midY)).not.toBe(dec);
    expect(document.elementFromPoint(d.left + d.width / 2, d.top - 6)).toBe(dec);
    expect(document.elementFromPoint(d.left + d.width / 2, d.bottom + 6)).toBe(dec);
    expect(document.elementFromPoint(d.left + d.width / 2, d.top - 8)).not.toBe(dec);
    // +: the same to the right.
    expect(document.elementFromPoint(i.right + 11, midY)).toBe(inc);
    expect(document.elementFromPoint(i.right + 13, midY)).not.toBe(inc);
    expect(document.elementFromPoint(i.left + i.width / 2, i.top - 6)).toBe(inc);
    // Neither layer lies over the number.
    const value = el.querySelector<HTMLElement>('.rds-number-input__value')!.getBoundingClientRect();
    const input = field(el)!;
    for (const x of [value.left + 1, value.left + value.width / 2, value.right - 1]) {
      const hit = document.elementFromPoint(x, midY);
      expect(hit === dec || hit === inc).toBe(false);
      expect(value.left <= x && x <= value.right && (hit === input || input.parentElement!.contains(hit))).toBe(true);
    }
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('NumberInput onRemove', () => {
  const remove = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('[aria-label="Remover item"]');

  it('without onRemove nothing changes: at the minimum the − turns off', async () => {
    const el = await render(<NumberInput label="Quantidade" defaultValue={1} min={1} />);
    expect(remove(el)).toBeNull();
    expect(minus(el).disabled).toBe(true);
    expect(minus(el).tabIndex).toBe(-1);
  });

  it('at the minimum the − becomes a bin: on, in the Tab order, named removeLabel; above it, the − again', async () => {
    const el = await render(<NumberInput label="Quantidade" defaultValue={2} min={1} debounce={0} onRemove={() => {}} />);
    expect(remove(el)).toBeNull();
    expect(minus(el).disabled).toBe(false);
    await act(async () => minus(el).click());
    const bin = remove(el)!;
    expect(bin).not.toBeNull();
    expect(bin.disabled).toBe(false);
    expect(bin.tabIndex).toBe(0);
    // The bin is drawn (the trash-2 stroke), not the dash.
    expect(bin.querySelectorAll('svg path')).toHaveLength(4);
    await act(async () => plus(el).click());
    expect(remove(el)).toBeNull();
    expect(minus(el)).not.toBeNull();
  });

  it('the bin calls onRemove, by click and by keyboard (Shift+Tab from the number, then Enter or Space)', async () => {
    const onRemove = vi.fn();
    const onChange = vi.fn();
    const el = await render(
      <NumberInput label="Quantidade" defaultValue={1} min={1} debounce={0} onRemove={onRemove} onChange={onChange} />,
    );
    await act(async () => remove(el)!.click());
    expect(onRemove).toHaveBeenCalledTimes(1);
    field(el)!.focus();
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(remove(el));
    await userEvent.keyboard('{Enter}');
    expect(onRemove).toHaveBeenCalledTimes(2);
    await userEvent.keyboard(' ');
    expect(onRemove).toHaveBeenCalledTimes(3);
    expect(onChange).not.toHaveBeenCalled();
    // The arrows still move the number, and the + still steps.
    field(el)!.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(field(el)!.getAttribute('aria-valuenow')).toBe('2');
  });

  it('a custom removeLabel; disabled, the bin is off', async () => {
    const el = await render(
      <div>
        <NumberInput label="Pessoas" defaultValue={0} min={0} onRemove={() => {}} removeLabel="Tirar da lista" />
        <NumberInput label="Pessoas" defaultValue={0} min={0} onRemove={() => {}} disabled />
      </div>,
    );
    expect(el.querySelector('[aria-label="Tirar da lista"]')).not.toBeNull();
    expect(remove(el)!.disabled).toBe(true);
  });

  it('in sm the bin keeps the 32 width', async () => {
    const el = await render(<NumberInput size="sm" label="Quantidade" defaultValue={1} min={1} onRemove={() => {}} />);
    const r = remove(el)!.getBoundingClientRect();
    expect(r.width).toBe(32);
    expect(el.querySelector<HTMLElement>('.rds-field__box')!.getBoundingClientRect().height).toBe(32);
  });
});
