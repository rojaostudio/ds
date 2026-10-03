import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { userEvent } from 'vitest/browser';
import { Input } from './input';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const Search = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
  </svg>
);

describe.each(MODES)('Input (%s)', (mode) => {
  it('every state passes axe: empty, filled, hint, error, disabled, required, floating, affixes, clear', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
        <Input label="Nome" />
        <Input label="Nome" defaultValue="Ana" />
        <Input label="E-mail" type="email" hint="Usamos só para o recibo." />
        <Input label="CPF" defaultValue="123" errorMessage="CPF incompleto: são 11 dígitos." />
        <Input label="CPF" error />
        <Input label="Nome" disabled />
        <Input label="Nome" disabled defaultValue="Ana" />
        <Input label="Nome" required />
        <Input label="Nome" labelPosition="floating" />
        <Input label="Nome" labelPosition="floating" defaultValue="Ana" />
        <Input label="Nome" labelPosition="floating" errorMessage="Diga seu nome." />
        <Input label="Nome" labelPosition="floating" disabled />
        <Input label="Valor" prefix="R$" suffix="por mês" defaultValue="10" />
        <Input label="Valor" prefix="R$" suffix="por mês" disabled defaultValue="10" />
        <Input label="Buscar" type="search" leadingIcon={<Search />} trailingIcon={<Search />} clearable defaultValue="ab" />
        <Input aria-label="Buscar" type="search" leadingIcon={<Search />} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('is 44px tall, 56px with the floating label', async () => {
    const el = await render(
      <>
        <Input label="Nome" />
        <Input label="Nome" labelPosition="floating" />
      </>,
      mode,
    );
    const [top, floating] = Array.from(el.querySelectorAll<HTMLElement>('.rds-field__box'));
    expect(top.getBoundingClientRect().height).toBe(44);
    expect(floating.getBoundingClientRect().height).toBe(56);
  });
});

describe('Input behaviour', () => {
  it('the top label on the rojao light theme passes axe', async () => {
    const el = await render(<Input label="Nome" />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the label is tied to the input, top and floating', async () => {
    const el = await render(
      <>
        <Input label="Nome" />
        <Input label="Sobrenome" labelPosition="floating" />
      </>,
    );
    const [a, b] = Array.from(el.querySelectorAll('input'));
    expect(a.labels?.[0]?.textContent).toBe('Nome');
    expect(b.labels?.[0]?.textContent).toBe('Sobrenome');
  });

  it('hint is the description; errorMessage turns on aria-invalid and replaces it', async () => {
    const el = await render(
      <>
        <Input label="E-mail" hint="Usamos só para o recibo." />
        <Input label="CPF" hint="Só números." errorMessage="CPF incompleto." />
        <Input label="CEP" error />
      </>,
    );
    const [hinted, wrong, flagged] = Array.from(el.querySelectorAll('input'));
    expect(hinted.getAttribute('aria-invalid')).toBeNull();
    expect(document.getElementById(hinted.getAttribute('aria-describedby')!)?.textContent).toBe('Usamos só para o recibo.');
    expect(wrong.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(wrong.getAttribute('aria-describedby')!)?.textContent).toBe('CPF incompleto.');
    expect(el.textContent).not.toContain('Só números.');
    expect(flagged.getAttribute('aria-invalid')).toBe('true');
    expect(flagged.getAttribute('aria-describedby')).toBeNull();
  });

  it('required: the native required and a hidden asterisk', async () => {
    const el = await render(<Input label="Nome" required />);
    const input = el.querySelector('input')!;
    expect(input.required).toBe(true);
    expect(el.querySelector('.rds-field__required')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('the clear button empties the field, fires onChange and gives focus back', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    const el = await render(<Input label="Buscar" clearable onChange={onChange} onClear={onClear} />);
    const input = el.querySelector('input')!;
    expect(el.querySelector('.rds-field__action')).toBeNull();
    input.focus();
    await userEvent.keyboard('abc');
    const clear = el.querySelector<HTMLButtonElement>('.rds-field__action')!;
    expect(clear.getAttribute('aria-label')).toBe('Limpar');
    await act(async () => clear.click());
    expect(input.value).toBe('');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ target: input }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(input);
    expect(el.querySelector('.rds-field__action')).toBeNull();
  });

  it('disabled is the native one and hides the clear button', async () => {
    const el = await render(<Input label="Nome" disabled clearable defaultValue="Ana" />);
    expect(el.querySelector('input')!.disabled).toBe(true);
    expect(el.querySelector('.rds-field__action')).toBeNull();
  });
});
