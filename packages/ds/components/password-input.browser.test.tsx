import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { PasswordInput } from './password-input';
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
