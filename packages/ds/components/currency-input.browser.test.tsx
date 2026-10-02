import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { userEvent } from 'vitest/browser';
import { CurrencyInput } from './currency-input';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// The Input's top label is text/heading, flare-700 on the rojao light theme: pinned with it.fails in
// input.browser.test.tsx.
const KNOWN_LIGHT_LABEL = (mode: string) => (mode === 'light' ? ['.rds-field__label'] : []);

const field = (el: HTMLElement) => el.querySelector<HTMLInputElement>('input[inputmode="numeric"]')!;

describe.each(MODES)('CurrencyInput (%s)', (mode) => {
  it('empty, filled, with hint, in error and disabled pass axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 320 }}>
        <CurrencyInput name="a" currency="BRL" label="Preço" />
        <CurrencyInput name="b" currency="BRL" label="Preço" defaultValueSubunits={9900} hint="Com impostos" />
        <CurrencyInput name="c" currency="BRL" label="Preço" errorMessage="Informe um preço maior que zero." />
        <CurrencyInput name="d" currency="USD" label="Price" defaultValueSubunits={500} disabled />
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT_LABEL(mode))).toEqual([]);
  });
});

describe('CurrencyInput behaviour', () => {
  it('is the Input with the symbol as its prefix; each digit typed is a cent', async () => {
    const onChange = vi.fn();
    const el = await render(<CurrencyInput name="price" currency="BRL" label="Preço" onChange={onChange} />);
    expect(el.querySelector('.rds-input .rds-field__affix')!.textContent).toBe('R$');
    const input = field(el);
    expect(input.placeholder).toBe('0,00');
    await userEvent.type(input, '1234');
    expect(input.value).toBe('12,34');
    expect(el.querySelector<HTMLInputElement>('input[type="hidden"][name="price"]')!.value).toBe('1234');
    expect(onChange).toHaveBeenLastCalledWith(1234);
    await userEvent.keyboard('{Backspace}');
    expect(input.value).toBe('1,23');
  });

  it('pasting a formatted amount keeps the digits; maxDigits caps them', async () => {
    const el = await render(<CurrencyInput name="p" currency="BRL" label="Preço" maxDigits={4} />);
    const input = field(el);
    // A paste lands as a new value of the field: the same path React's onChange takes.
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'R$ 50,00');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(input.value).toBe('50,00');
    await userEvent.type(input, '9');
    expect(input.value).toBe('50,00');
  });

  it('resolves the decimals from the currency: JPY has none', async () => {
    const el = await render(<CurrencyInput name="y" currency="JPY" label="Preço" defaultValueSubunits={1500} />);
    expect(field(el).value).toBe('1,500');
  });
});
