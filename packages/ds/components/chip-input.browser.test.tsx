import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { userEvent } from 'vitest/browser';
import { ChipInput } from './chip-input';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// The [RDS] maps chip-input/label/color to text/heading, and the rojao light heading is flare-700 (#ff6a00, 2.9:1
// on white) for a 14px label. Kept out of the light axe matrix and pinned below until the Figma decides.
const KNOWN_LIGHT_LABEL = (mode: string) => (mode === 'light' ? ['.rds-field__label'] : []);

const field = (el: HTMLElement) => el.querySelector<HTMLInputElement>('.rds-field__control')!;
const chips = (el: HTMLElement) => Array.from(el.querySelectorAll('.rds-chip__label')).map((c) => c.textContent);

describe.each(MODES)('ChipInput (%s)', (mode) => {
  it('every state passes axe: empty, filled, hint, error, required, disabled', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 320 }}>
        <ChipInput label="Etiquetas" placeholder="Digite e aperte Enter" />
        <ChipInput label="Etiquetas" defaultValue={['Design', 'Produto', 'Pesquisa']} />
        <ChipInput label="Etiquetas" hint="Até 5 etiquetas. Enter ou vírgula cria." required />
        <ChipInput label="Etiquetas" defaultValue={['Design']} errorMessage="Use no máximo 5 etiquetas." />
        <ChipInput label="Etiquetas" disabled defaultValue={['Design', 'Produto']} />
        <ChipInput label="Etiquetas" disabled placeholder="Digite e aperte Enter" />
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT_LABEL(mode))).toEqual([]);
  });

  it('the open suggestions pass axe', async () => {
    const el = await render(
      <div style={{ maxWidth: 320, paddingBottom: 240 }}>
        <ChipInput label="Etiquetas" suggestions={['Design', 'Desenvolvimento', 'Produto']} />
      </div>,
      mode,
    );
    field(el).focus();
    await userEvent.keyboard('De');
    expect(document.querySelector('[role="listbox"]')).not.toBeNull();
    expect(await axeViolations(el, KNOWN_LIGHT_LABEL(mode))).toEqual([]);
  });

  it('the box starts at 44 and grows down when the chips wrap', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, width: 320 }}>
        <ChipInput label="Etiquetas" />
        <ChipInput label="Etiquetas" defaultValue={['Design', 'Produto', 'Pesquisa', 'Marketing', 'Vendas']} />
      </div>,
      mode,
    );
    const [empty, full] = Array.from(el.querySelectorAll<HTMLElement>('.rds-field__box'));
    expect(empty.getBoundingClientRect().height).toBe(44);
    expect(full.getBoundingClientRect().height).toBeGreaterThan(44);
  });
});

describe('ChipInput behaviour', () => {
  it.fails('the top label on the rojao light theme passes axe (text/heading is flare-700)', async () => {
    const el = await render(<ChipInput label="Etiquetas" />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('Enter or a comma turns the text into a Chip; Backspace on the empty field takes the last', async () => {
    const onChange = vi.fn();
    const el = await render(<ChipInput label="Etiquetas" onChange={onChange} />);
    const input = field(el);
    input.focus();
    await userEvent.keyboard('Design{Enter}Produto,Pesquisa,');
    expect(chips(el)).toEqual(['Design', 'Produto', 'Pesquisa']);
    expect(onChange).toHaveBeenLastCalledWith(['Design', 'Produto', 'Pesquisa']);
    expect(input.value).toBe('');
    await userEvent.keyboard('{Backspace}');
    expect(chips(el)).toEqual(['Design', 'Produto']);
    // A repeat is not added; an empty Enter adds nothing.
    await userEvent.keyboard('Design{Enter}{Enter}');
    expect(chips(el)).toEqual(['Design', 'Produto']);
  });

  it('a pasted list becomes chips up to the last comma', async () => {
    const el = await render(<ChipInput label="E-mails" />);
    const input = field(el);
    input.focus();
    // fill sets the whole text at once, as a paste does.
    await userEvent.fill(input, 'ana@x.com, bia@x.com, cai');
    expect(chips(el)).toEqual(['ana@x.com', 'bia@x.com']);
    expect(input.value).toBe('cai');
  });

  it('each × is named "Remover <valor>"; the last one removed gives the focus back to the field', async () => {
    function Controlled() {
      const [value, setValue] = useState(['Design', 'Produto']);
      return <ChipInput label="Etiquetas" value={value} onChange={setValue} />;
    }
    const el = await render(<Controlled />);
    const removeDesign = el.querySelector<HTMLButtonElement>('[aria-label="Remover Design"]')!;
    removeDesign.focus();
    await userEvent.keyboard('{Enter}');
    expect(chips(el)).toEqual(['Produto']);
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toBe('Remover Produto'));
    await userEvent.keyboard('{Enter}');
    expect(chips(el)).toEqual([]);
    await vi.waitFor(() => expect(document.activeElement).toBe(field(el)));
  });

  it('max stops new chips; onCreate can change or refuse the text', async () => {
    const el = await render(
      <ChipInput label="Etiquetas" max={2} onCreate={(text) => (text === 'x' ? null : text.toLowerCase())} />,
    );
    field(el).focus();
    await userEvent.keyboard('x{Enter}DESIGN{Enter}Produto{Enter}Pesquisa{Enter}');
    expect(chips(el)).toEqual(['design', 'produto']);
  });

  it('suggestions: the arrows walk the list, Enter takes the active one, "Criar" adds what is not there', async () => {
    const onChange = vi.fn();
    const el = await render(
      <div style={{ paddingBottom: 240 }}>
        <ChipInput label="Etiquetas" suggestions={['Design', 'Desenvolvimento', 'Produto']} onChange={onChange} />
      </div>,
    );
    const input = field(el);
    expect(input.getAttribute('role')).toBe('combobox');
    input.focus();
    await userEvent.keyboard('des{ArrowDown}{ArrowDown}{Enter}');
    expect(chips(el)).toEqual(['Desenvolvimento']);
    await userEvent.keyboard('Novo');
    expect(document.querySelector('[role="listbox"]')!.textContent).toContain('Criar "Novo"');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(chips(el)).toEqual(['Desenvolvimento', 'Novo']);
    // Without an active option, Enter keeps the text as it is.
    await userEvent.keyboard('Pro{Enter}');
    expect(chips(el)).toEqual(['Desenvolvimento', 'Novo', 'Pro']);
  });

  it('label, hint, error and required as in the Input; disabled turns the chips off', async () => {
    const el = await render(
      <>
        <ChipInput label="Etiquetas" hint="Até 5 etiquetas." required name="tags" defaultValue={['a', 'b']} />
        <ChipInput label="Etiquetas" errorMessage="Use no máximo 5 etiquetas." />
        <ChipInput label="Etiquetas" disabled defaultValue={['a']} />
      </>,
    );
    const [first, wrong, off] = Array.from(el.querySelectorAll<HTMLInputElement>('.rds-field__control'));
    expect(first.labels?.[0]?.textContent).toBe('Etiquetas *');
    expect(first.getAttribute('aria-required')).toBe('true');
    expect(document.getElementById(first.getAttribute('aria-describedby')!)?.textContent).toBe('Até 5 etiquetas.');
    expect(Array.from(el.querySelectorAll<HTMLInputElement>('input[name="tags"]')).map((i) => i.value)).toEqual(['a', 'b']);
    expect(wrong.getAttribute('aria-invalid')).toBe('true');
    expect(off.disabled).toBe(true);
    expect(el.querySelectorAll('.rds-chip--disabled')).toHaveLength(1);
  });

  it('helper is the old name of hint', async () => {
    const el = await render(<ChipInput label="Etiquetas" helper="Enter cria." />);
    expect(el.querySelector('.rds-field__hint')?.textContent).toBe('Enter cria.');
  });
});
