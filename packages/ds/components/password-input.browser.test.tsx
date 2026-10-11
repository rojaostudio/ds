import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { userEvent } from 'vitest/browser';
import { PasswordInput, passwordStrength } from './password-input';
import { Button } from './button';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const announcer = () => document.querySelector('[data-rds-announcer]')?.textContent;

describe.each(MODES)('PasswordInput (%s)', (mode) => {
  it('every state passes axe: empty, filled, revealed, hint, error, disabled, required, floating', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
        <PasswordInput label="Senha" />
        <PasswordInput label="Senha" defaultValue="segredo" />
        <PasswordInput label="Senha" defaultValue="segredo" defaultRevealed />
        <PasswordInput label="Nova senha" autoComplete="new-password" hint="Pelo menos 8 caracteres." />
        <PasswordInput label="Senha" errorMessage="Senha incorreta. Tente de novo ou redefina." />
        <PasswordInput label="Senha" disabled />
        <PasswordInput label="Senha" required />
        <PasswordInput label="Nova senha" autoComplete="new-password" showStrength defaultValue="abc12345" hint="Pelo menos 8 caracteres." />
        <PasswordInput label="Senha" labelPosition="floating" />
        <PasswordInput label="Senha" labelPosition="floating" defaultValue="segredo" />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('PasswordInput behaviour', () => {
  it('the top label on the rojao light theme passes axe', async () => {
    const el = await render(<PasswordInput label="Senha" />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the eye shows and hides the password, with aria-pressed and an announcement', async () => {
    const onRevealedChange = vi.fn();
    const el = await render(<PasswordInput label="Senha" defaultValue="segredo" onRevealedChange={onRevealedChange} />);
    const input = el.querySelector('input')!;
    const eye = el.querySelector<HTMLButtonElement>('.rds-field__action')!;
    expect(input.labels?.[0]?.textContent).toBe('Senha');
    expect(input.type).toBe('password');
    expect(eye.getAttribute('aria-label')).toBe('Mostrar senha');
    expect(eye.getAttribute('aria-pressed')).toBe('false');
    expect(eye.getAttribute('aria-controls')).toBe(input.id);

    await act(async () => eye.click());
    expect(input.type).toBe('text');
    expect(eye.getAttribute('aria-pressed')).toBe('true');
    expect(onRevealedChange).toHaveBeenLastCalledWith(true);
    await vi.waitFor(() => expect(announcer()).toBe('Senha visível'));

    await act(async () => eye.click());
    expect(input.type).toBe('password');
    expect(eye.getAttribute('aria-pressed')).toBe('false');
    await vi.waitFor(() => expect(announcer()).toBe('Senha oculta'));
  });

  it('errorMessage turns on aria-invalid and is the description', async () => {
    const el = await render(<PasswordInput label="Senha" errorMessage="Senha incorreta." />);
    const input = el.querySelector('input')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe('Senha incorreta.');
  });

  it('autocomplete defaults to current-password; disabled also disables the eye', async () => {
    const el = await render(<PasswordInput label="Senha" disabled />);
    expect(el.querySelector('input')!.autocomplete).toBe('current-password');
    expect(el.querySelector<HTMLButtonElement>('.rds-field__action')!.disabled).toBe(true);
  });
});

describe('PasswordInput strength', () => {
  it.each([
    ['', 'none'],
    ['abc', 'weak'],
    ['abcdefgh', 'weak'],
    ['abcd1234', 'fair'],
    ['Abcd1234', 'good'],
    ['Abcd1234!', 'strong'],
    ['abcdefgh1234', 'good'],
  ] as const)('passwordStrength(%j) is %s', (value, level) => {
    expect(passwordStrength(value)).toBe(level);
  });

  it('is off by default', async () => {
    const el = await render(<PasswordInput label="Senha" defaultValue="abc" />);
    expect(el.querySelector('.rds-password-input__strength')).toBeNull();
  });

  it('sits between the box and the hint, lights the segments as you type and says the level once', async () => {
    const el = await render(<PasswordInput label="Nova senha" autoComplete="new-password" showStrength hint="Pelo menos 8 caracteres." />);
    const meter = el.querySelector<HTMLElement>('.rds-password-input__strength')!;
    expect(meter.previousElementSibling!.className).toContain('rds-field__box');
    expect(meter.nextElementSibling!.className).toContain('rds-field__hint');
    const lit = () => el.querySelectorAll('.rds-password-input__segment--lit').length;
    expect(lit()).toBe(0);
    const input = el.querySelector('input')!;
    expect(input.getAttribute('aria-describedby')).toContain(meter.id);
    await userEvent.type(input, 'abcd1234');
    expect(lit()).toBe(2);
    expect(meter.textContent).toBe('Força da senha: Razoável');
    await vi.waitFor(() => expect(announcer()).toBe('Força da senha: razoável'));
    await userEvent.type(input, 'X!');
    expect(lit()).toBe(4);
    await vi.waitFor(() => expect(announcer()).toBe('Força da senha: forte'));
  });

  it('the bar keeps its width from none to strong', async () => {
    const el = await render(
      <div style={{ width: 320 }}>
        <PasswordInput label="Senha" showStrength />
        <PasswordInput label="Senha" showStrength strength="strong" />
      </div>,
    );
    const bars = [...el.querySelectorAll('.rds-password-input__bar')].map((b) => b.getBoundingClientRect().width);
    expect(bars[0]).toBe(bars[1]);
    expect(el.querySelectorAll('.rds-password-input__segment')[0].getBoundingClientRect().height).toBe(4);
  });

  it('strength from the product wins over the meter', async () => {
    const el = await render(<PasswordInput label="Senha" showStrength strength="weak" defaultValue="Abcd1234!" />);
    expect(el.querySelectorAll('.rds-password-input__segment--lit')).toHaveLength(1);
  });
});

describe('PasswordInput labelAction', () => {
  it('sits on the label line, on the right, outside the label, and comes after the field in Tab order', async () => {
    const el = await render(
      <div style={{ width: 360 }}>
        <PasswordInput label="Senha" labelAction={<Button variant="ghost" size="sm">Esqueci a senha</Button>} />
      </div>,
    );
    const label = el.querySelector('label')!;
    const action = el.querySelector('.rds-field__label-action button')!;
    expect(label.contains(action)).toBe(false);
    const field = el.querySelector('.rds-field')!.getBoundingClientRect();
    const lr = label.getBoundingClientRect(), ar = el.querySelector('.rds-field__label-action')!.getBoundingClientRect();
    expect(Math.round(ar.top)).toBe(Math.round(lr.top));
    expect(Math.round(ar.right)).toBe(Math.round(field.right));
    const input = el.querySelector('input')!;
    expect(input.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(el.querySelector('.rds-field__box')!.getBoundingClientRect().top - lr.bottom).toBeGreaterThanOrEqual(4);
    // The 32 tall button does not push the box down: same offset as a field without the action.
    const withAction = Math.round(el.querySelector('.rds-field__box')!.getBoundingClientRect().top - field.top);
    expect(await axeViolations(el)).toEqual([]);
    const plain = await render(<div style={{ width: 360 }}><PasswordInput label="Senha" /></div>);
    const plainField = plain.querySelector('.rds-field')!.getBoundingClientRect();
    const plainBox = plain.querySelector('.rds-field__box')!.getBoundingClientRect();
    expect(withAction).toBe(Math.round(plainBox.top - plainField.top));
  });

  it('floating: the action goes under the field, on the right', async () => {
    const el = await render(
      <div style={{ width: 360 }}>
        <PasswordInput label="Senha" labelPosition="floating" labelAction={<Button variant="ghost" size="sm">Esqueci a senha</Button>} />
      </div>,
    );
    const box = el.querySelector('.rds-field__box')!.getBoundingClientRect();
    const ar = el.querySelector('.rds-field__label-action')!.getBoundingClientRect();
    expect(ar.top).toBeGreaterThanOrEqual(box.bottom);
    expect(Math.round(ar.right)).toBe(Math.round(box.right));
  });
});
