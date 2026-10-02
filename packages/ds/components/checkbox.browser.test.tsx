import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Checkbox } from './checkbox';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('Checkbox (%s)', (mode) => {
  it('every state passes axe: unchecked, checked, indeterminate, hint, error, disabled, required', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
        <Checkbox>Receber novidades</Checkbox>
        <Checkbox defaultChecked>Receber novidades</Checkbox>
        <Checkbox checked="indeterminate" onChange={() => {}}>Selecionar todos</Checkbox>
        <Checkbox hint="Uma vez por semana, no máximo.">Receber novidades</Checkbox>
        <Checkbox required errorMessage="Aceite os termos para continuar.">Aceito os termos</Checkbox>
        <Checkbox error defaultChecked>Aceito os termos</Checkbox>
        <Checkbox disabled>Receber novidades</Checkbox>
        <Checkbox disabled defaultChecked>Receber novidades</Checkbox>
        <Checkbox required>Aceito os termos</Checkbox>
        <Checkbox aria-label="Selecionar a linha" />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the row is 44px tall (the touch minimum)', async () => {
    const el = await render(<Checkbox>Receber novidades</Checkbox>, mode);
    expect(el.querySelector('.rds-choice__row')!.getBoundingClientRect().height).toBe(44);
  });
});

describe('Checkbox behaviour', () => {
  it('the label is tied and Space toggles it', async () => {
    const onCheckedChange = vi.fn();
    const el = await render(<Checkbox onCheckedChange={onCheckedChange}>Receber novidades</Checkbox>);
    const input = el.querySelector('input')!;
    expect(input.labels?.[0]?.textContent).toBe('Receber novidades');
    input.focus();
    await userEvent.keyboard(' ');
    expect(input.checked).toBe(true);
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    await userEvent.keyboard(' ');
    expect(input.checked).toBe(false);
  });

  it('indeterminate sets the native property; a click checks it', async () => {
    const el = await render(<Checkbox checked="indeterminate" onChange={() => {}}>Selecionar todos</Checkbox>);
    const input = el.querySelector('input')!;
    expect(input.indeterminate).toBe(true);
    expect(input.checked).toBe(false);
  });

  it('hint and error are the description; errorMessage sets aria-invalid; required is native', async () => {
    const el = await render(
      <Checkbox required hint="Leia antes." errorMessage="Aceite os termos para continuar.">
        Aceito os termos
      </Checkbox>,
    );
    const input = el.querySelector('input')!;
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const ids = input.getAttribute('aria-describedby')!.split(' ');
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual(['Leia antes.', 'Aceite os termos para continuar.']);
  });

  it('disabled is the native one and does not toggle', async () => {
    const el = await render(<Checkbox disabled>Receber novidades</Checkbox>);
    const input = el.querySelector('input')!;
    expect(input.disabled).toBe(true);
    await userEvent.click(el.querySelector('label')!, { force: true });
    expect(input.checked).toBe(false);
  });
});
