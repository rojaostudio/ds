import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { InputOTP } from './input-otp';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const slots = (el: HTMLElement) => Array.from(el.querySelectorAll('.rds-otp__slot')).map((s) => s.textContent);

describe.each(MODES)('InputOTP (%s)', (mode) => {
  it('empty, partly filled, error and disabled pass axe, 4 and 6 digits', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16 }}>
        <InputOTP label="Código de verificação" hint="Enviamos o código para o seu e-mail." />
        <InputOTP label="Código de verificação" length={4} defaultValue="48" />
        <InputOTP label="Código de verificação" length={4} defaultValue="4827" errorMessage="Código incorreto. Confira e tente de novo." />
        <InputOTP label="Código de verificação" length={4} disabled />
        <InputOTP aria-label="Código de verificação" length={6} showSeparator={false} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the active box passes axe while typing', async () => {
    const el = await render(<InputOTP label="Código de verificação" length={4} />, mode);
    el.querySelector('input')!.focus();
    await userEvent.keyboard('48');
    expect(el.querySelector('.rds-otp__slot--active')).not.toBeNull();
    expect(await axeViolations(el)).toEqual([]);
  });

  it('boxes of 48 × 56, 8 apart', async () => {
    const el = await render(<InputOTP label="Código" length={4} />, mode);
    const [a, b] = Array.from(el.querySelectorAll<HTMLElement>('.rds-otp__slot')).map((s) => s.getBoundingClientRect());
    expect([a.width, a.height]).toEqual([48, 56]);
    expect(b.left - a.right).toBe(8);
  });
});

describe('InputOTP behaviour', () => {
  it('the label on the rojao light theme passes axe', async () => {
    const el = await render(<InputOTP label="Código de verificação" length={4} />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('one input for the whole code, ready for the SMS autofill', async () => {
    const el = await render(<InputOTP label="Código de verificação" hint="Enviamos o código para o seu e-mail." />);
    const input = el.querySelector('input')!;
    expect(input.autocomplete).toBe('one-time-code');
    expect(input.inputMode).toBe('numeric');
    expect(input.pattern).toBe('\\d{6}');
    expect(input.labels?.[0]?.textContent).toBe('Código de verificação');
    expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe('Enviamos o código para o seu e-mail.');
    expect(el.querySelectorAll('.rds-otp__slot')).toHaveLength(6);
    expect(el.querySelector('.rds-otp__separator')).not.toBeNull();
  });

  it('typing moves on by itself, drops letters, and Backspace takes the last digit back', async () => {
    const onComplete = vi.fn();
    const el = await render(<InputOTP label="Código" onComplete={onComplete} />);
    const input = el.querySelector('input')!;
    input.focus();
    await userEvent.keyboard('48a2');
    expect(slots(el)).toEqual(['4', '8', '2', '', '', '']);
    expect(el.querySelectorAll('.rds-otp__slot')[3].classList.contains('rds-otp__slot--active')).toBe(true);
    await userEvent.keyboard('{Backspace}');
    expect(input.value).toBe('48');
    await userEvent.keyboard('2915');
    expect(onComplete).toHaveBeenCalledWith('482915');
  });

  it('pasting the whole code fills every box', async () => {
    const onComplete = vi.fn();
    const el = await render(
      <>
        <input aria-label="Origem" defaultValue="123-456" />
        <InputOTP label="Código" onComplete={onComplete} />
      </>,
    );
    const [source, input] = Array.from(el.querySelectorAll('input'));
    source.select();
    await userEvent.copy();
    input.focus();
    await userEvent.paste();
    await vi.waitFor(() => expect(input.value).toBe('123456'));
    expect(slots(el)).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('error keeps the digits and reads the message; disabled is the native one', async () => {
    const el = await render(
      <>
        <InputOTP label="Código" length={4} defaultValue="4827" errorMessage="Código incorreto." hint="Enviamos por e-mail." />
        <InputOTP label="Código" length={4} disabled />
      </>,
    );
    const [wrong, off] = Array.from(el.querySelectorAll('input'));
    expect(wrong.value).toBe('4827');
    expect(wrong.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(wrong.getAttribute('aria-describedby')!)?.textContent).toBe('Código incorreto.');
    expect(el.textContent).not.toContain('Enviamos por e-mail.');
    expect(off.disabled).toBe(true);
  });
});
