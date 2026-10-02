import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { PhoneInput } from './phone-input';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// The Input's top label is text/heading, flare-700 on the rojao light theme: pinned with it.fails in
// input.browser.test.tsx.
const KNOWN_LIGHT_LABEL = (mode: string) => (mode === 'light' ? ['.rds-field__label'] : []);

describe.each(MODES)('PhoneInput (%s)', (mode) => {
  it('with label, hint, error and disabled passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
        <PhoneInput label="WhatsApp" helper="Com DDD" />
        <PhoneInput label="WhatsApp" defaultValue="+5511987654321" error="Número incompleto." />
        <PhoneInput label="Telefone" optional disabled />
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT_LABEL(mode))).toEqual([]);
  });
});

describe('PhoneInput behaviour', () => {
  it('is a Combobox (the country) and an Input with the dial code as prefix; the boxes line up', async () => {
    const el = await render(<PhoneInput label="WhatsApp" />);
    expect(el.querySelector('[role="combobox"][aria-label="País"]')).not.toBeNull();
    expect(el.querySelector('.rds-phone-input__number .rds-field__affix')!.textContent).toBe('+55');
    const [country, number] = el.querySelectorAll<HTMLElement>('.rds-field__box');
    expect(Math.round(country.getBoundingClientRect().top)).toBe(Math.round(number.getBoundingClientRect().top));
  });

  it('types the national number and hands E.164 to onChange and the hidden input', async () => {
    const onChange = vi.fn();
    const el = await render(<PhoneInput label="WhatsApp" name="phone" onChange={onChange} />);
    await userEvent.type(el.querySelector<HTMLInputElement>('input[type="tel"]')!, '11987654321');
    expect(onChange).toHaveBeenLastCalledWith('+5511987654321');
    expect(el.querySelector<HTMLInputElement>('input[type="hidden"][name="phone"]')!.value).toBe('+5511987654321');
  });

  it('says (opcional) after the label', async () => {
    const el = await render(<PhoneInput label="Telefone" optional />);
    expect(el.querySelector('.rds-field__label')!.textContent).toBe('Telefone (opcional)');
  });
});
