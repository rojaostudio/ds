import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { PhoneInput } from './phone-input';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const countryButton = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('.rds-phone-input__country')!;
const numberInput = (el: HTMLElement) => el.querySelector<HTMLInputElement>('input[type="tel"]')!;
const search = () => document.querySelector<HTMLInputElement>('input[aria-label="Buscar país"]');
const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')];
const settle = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
/** A real paste event (the clipboard text in a DataTransfer), the way a browser fires it. */
const pasteInto = (input: HTMLInputElement, text: string) => {
  const data = new DataTransfer();
  data.setData('text', text);
  input.focus();
  input.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
};

describe.each(MODES)('PhoneInput (%s)', (mode) => {
  it('with label, hint, error and disabled passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
        <PhoneInput label="WhatsApp" hint="Com DDD." />
        <PhoneInput label="WhatsApp" defaultValue="+5511987654321" error errorMessage="Número incompleto. Confira os dígitos." />
        <PhoneInput label="Telefone" optional disabled />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the open country list passes axe', async () => {
    await page.viewport(1280, 800);
    const el = await render(<PhoneInput label="WhatsApp" />, mode);
    await userEvent.click(countryButton(el));
    await settle();
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe('PhoneInput field', () => {
  it('is one field: the country button, a hairline and the number in the same box; the dial code shows once', async () => {
    const el = await render(<PhoneInput label="WhatsApp" />);
    const boxes = el.querySelectorAll('.rds-field__box');
    expect(boxes).toHaveLength(1);
    const box = boxes[0];
    expect(box.querySelector('.rds-phone-input__country')).not.toBeNull();
    expect(box.querySelector('.rds-phone-input__divider')).not.toBeNull();
    expect(box.querySelector('input[type="tel"]')).not.toBeNull();
    expect((el.textContent ?? '').match(/\+55/g)).toHaveLength(1);
    expect(box.getBoundingClientRect().height).toBe(44);
  });

  it('the label is the field\'s, tied to the number; the button is named after it and the country', async () => {
    const el = await render(<PhoneInput label="WhatsApp" />);
    const label = el.querySelector<HTMLLabelElement>('.rds-field__label')!;
    expect(label.htmlFor).toBe(numberInput(el).id);
    expect(countryButton(el).getAttribute('aria-label')).toBe('País do WhatsApp: Brasil, +55');
  });

  it('error paints the whole field and ties the message to the number', async () => {
    const el = await render(<PhoneInput label="WhatsApp" error errorMessage="Falta o DDD." />);
    expect(el.querySelector('.rds-field--error')).not.toBeNull();
    const msg = el.querySelector('.rds-field__error-message')!;
    expect(msg.textContent).toBe('Falta o DDD.');
    expect(numberInput(el).getAttribute('aria-describedby')).toContain(msg.id);
    expect(numberInput(el).getAttribute('aria-invalid')).toBe('true');
  });

  it('the 2.x API still works: a string error is the message, helper is the hint', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = await render(
      <>
        <PhoneInput label="WhatsApp" error="Número incompleto." />
        <PhoneInput label="Telefone" helper="Só números" />
      </>,
    );
    expect(el.textContent).toContain('Número incompleto.');
    expect(el.textContent).toContain('Só números');
    warn.mockRestore();
  });

  it('size sm is 32 tall', async () => {
    const el = await render(<PhoneInput label="WhatsApp" size="sm" />);
    expect(el.querySelector('.rds-field__box')!.getBoundingClientRect().height).toBe(32);
  });

  it('says (opcional) after the label', async () => {
    const el = await render(<PhoneInput label="Telefone" optional />);
    expect(el.querySelector('.rds-field__label')!.textContent).toBe('Telefone (opcional)');
  });
});

describe('PhoneInput number', () => {
  it('types the national number and hands E.164 to onChange and the hidden input', async () => {
    const onChange = vi.fn();
    const el = await render(<PhoneInput label="WhatsApp" name="phone" onChange={onChange} />);
    await userEvent.type(numberInput(el), '11987654321');
    expect(onChange).toHaveBeenLastCalledWith('+5511987654321');
    expect(el.querySelector<HTMLInputElement>('input[type="hidden"][name="phone"]')!.value).toBe('+5511987654321');
  });

  it.each(['+55 11 98765-4321', '5511987654321', '011 98765-4321', '0 11 98765-4321'])('pasting %s leaves +5511987654321', async (text) => {
    const onChange = vi.fn();
    const el = await render(<PhoneInput label="WhatsApp" onChange={onChange} />);
    pasteInto(numberInput(el), text);
    await vi.waitFor(() => expect(onChange).toHaveBeenLastCalledWith('+5511987654321'));
  });

  it('pasting another country\'s code switches the country', async () => {
    const onChange = vi.fn();
    const el = await render(<PhoneInput label="WhatsApp" onChange={onChange} />);
    pasteInto(numberInput(el), '+351 912 345 678');
    await vi.waitFor(() => expect(onChange).toHaveBeenLastCalledWith('+351912345678'));
    await vi.waitFor(() => expect(countryButton(el).getAttribute('aria-label')).toBe('País do WhatsApp: Portugal, +351'));
  });

  it('2.x defaultValue with a trunk 0 no longer becomes +55011…', async () => {
    const el = await render(<PhoneInput label="WhatsApp" name="phone" defaultValue="011987654321" />);
    expect(el.querySelector<HTMLInputElement>('input[type="hidden"]')!.value).toBe('+5511987654321');
  });
});

describe('PhoneInput country list', () => {
  it('opens under the field, its width, with the search focused and the chosen country active', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <div style={{ width: 400 }}>
        <PhoneInput label="WhatsApp" />
      </div>,
    );
    await userEvent.click(countryButton(el));
    await settle();
    expect(document.activeElement).toBe(search());
    const box = el.querySelector('.rds-field__box')!.getBoundingClientRect();
    const pop = document.querySelector('.rds-phone-input__popover')!.getBoundingClientRect();
    expect(Math.round(pop.left)).toBe(Math.round(box.left));
    expect(Math.round(pop.width)).toBe(Math.round(box.width));
    expect(Math.round(pop.top - box.bottom)).toBe(4);
    const active = document.getElementById(search()!.getAttribute('aria-activedescendant')!)!;
    expect(active.getAttribute('aria-label')).toBe('Brasil, +55');
    expect(active.getAttribute('aria-selected')).toBe('true');
  });

  it('shows Sugeridos (Brasil, Portugal, Estados Unidos) and Todos os países, as named groups', async () => {
    await page.viewport(1280, 800);
    const el = await render(<PhoneInput label="WhatsApp" />);
    await userEvent.click(countryButton(el));
    await settle();
    const groups = [...document.querySelectorAll<HTMLElement>('[role="group"]')];
    expect(groups.map((g) => document.getElementById(g.getAttribute('aria-labelledby')!)!.textContent)).toEqual(['Sugeridos', 'Todos os países']);
    expect([...groups[0].querySelectorAll('[role="option"]')].map((o) => o.getAttribute('aria-label'))).toEqual([
      'Brasil, +55',
      'Portugal, +351',
      'Estados Unidos, +1',
    ]);
  });

  it('typing filters by name or code, drops the groups and announces how many', async () => {
    await page.viewport(1280, 800);
    const el = await render(<PhoneInput label="WhatsApp" />);
    await userEvent.click(countryButton(el));
    await settle();
    await userEvent.type(search()!, 'port');
    expect(document.querySelectorAll('[role="group"]')).toHaveLength(0);
    expect(options().map((o) => o.getAttribute('aria-label'))).toContain('Portugal, +351');
    await userEvent.clear(search()!);
    await userEvent.type(search()!, '+351');
    expect(options().map((o) => o.getAttribute('aria-label'))).toEqual(['Portugal, +351']);
    expect(document.querySelector('.rds-phone-input__panel [role="status"]')!.textContent).toBe('1 país');
  });

  it('Enter picks the active country, closes and moves the focus to the number; the mask follows', async () => {
    await page.viewport(1280, 800);
    const onChange = vi.fn();
    const el = await render(<PhoneInput label="WhatsApp" onChange={onChange} />);
    await userEvent.click(countryButton(el));
    await settle();
    await userEvent.type(search()!, 'portugal');
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(document.querySelector('.rds-phone-input__popover')).toBeNull();
    expect(document.activeElement).toBe(numberInput(el));
    expect(countryButton(el).getAttribute('aria-label')).toBe('País do WhatsApp: Portugal, +351');
    await userEvent.type(numberInput(el), '912345678');
    expect(onChange).toHaveBeenLastCalledWith('+351912345678');
  });

  it('Escape closes without changing and gives the focus back to the button', async () => {
    await page.viewport(1280, 800);
    const el = await render(<PhoneInput label="WhatsApp" />);
    countryButton(el).focus();
    await userEvent.keyboard('{ArrowDown}');
    await settle();
    await userEvent.keyboard('{ArrowDown}{Escape}');
    await settle();
    expect(document.querySelector('.rds-phone-input__popover')).toBeNull();
    expect(document.activeElement).toBe(countryButton(el));
    expect(countryButton(el).getAttribute('aria-label')).toBe('País do WhatsApp: Brasil, +55');
  });

  it('below 1024 it opens in a Drawer named País', async () => {
    await page.viewport(390, 800);
    try {
      const el = await render(<PhoneInput label="WhatsApp" />);
      await userEvent.click(countryButton(el));
      await settle();
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
      expect(dialog.className).toContain('rds-drawer');
      expect(dialog.textContent).toContain('País');
      expect(dialog.querySelector('input[aria-label="Buscar país"]')).not.toBeNull();
      const row = dialog.querySelector<HTMLElement>('[role="option"]')!;
      expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
      await userEvent.type(search()!, 'portugal');
      await userEvent.keyboard('{Enter}');
      await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
      await vi.waitFor(() => expect(document.activeElement).toBe(numberInput(el)));
    } finally {
      await page.viewport(1280, 800);
    }
  });
});
