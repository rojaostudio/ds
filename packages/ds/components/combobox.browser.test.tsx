import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Combobox } from './combobox';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// The [RDS] maps input/label/color to text/heading, and the rojao light heading is flare-700 (#ff6a00, 2.9:1
// on white) for a 14px label. Kept out of the light axe matrix and pinned below until the Figma decides.
const KNOWN_LIGHT_LABEL = (mode: string) => (mode === 'light' ? ['.rds-field__label'] : []);

const audiences = ['Compradores SP', 'Compradores RJ', 'Comerciantes', 'Lojistas SP', { value: 'adm', label: 'Administradores', disabled: true }];

const field = (el: HTMLElement, i = 0) => el.querySelectorAll<HTMLInputElement>('[role="combobox"]')[i];
const listbox = () => document.querySelector<HTMLElement>('[role="listbox"]');
const activeOption = (input: HTMLInputElement) => document.getElementById(input.getAttribute('aria-activedescendant') ?? '');

describe.each(MODES)('Combobox (%s)', (mode) => {
  it('every closed state passes axe: empty, chosen, hint, error, disabled, floating, multiple', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 320 }}>
        <Combobox label="Público" options={audiences} placeholder="Buscar público" />
        <Combobox label="Público" options={audiences} defaultValue="Compradores SP" />
        <Combobox label="Público" options={audiences} hint="Quem recebe a campanha." required />
        <Combobox label="Público" options={audiences} errorMessage="Escolha um público." />
        <Combobox label="Público" options={audiences} disabled defaultValue="Compradores RJ" />
        <Combobox label="Público" options={audiences} labelPosition="floating" />
        <Combobox label="Públicos" options={audiences} multiple defaultValue={['Compradores SP', 'Comerciantes']} />
        <Combobox label="Públicos" options={audiences} multiple disabled defaultValue={['Compradores SP']} />
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT_LABEL(mode))).toEqual([]);
  });

  it('open, empty and create menus pass axe', async () => {
    const el = await render(
      <div style={{ maxWidth: 320, paddingBottom: 320 }}>
        <Combobox label="Público" options={audiences} defaultValue="Compradores SP" creatable />
      </div>,
      mode,
    );
    const input = field(el);
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(listbox()).not.toBeNull();
    expect(await axeViolations(el, KNOWN_LIGHT_LABEL(mode))).toEqual([]);
    await userEvent.clear(input);
    await userEvent.type(input, 'Com');
    expect(el.textContent).toContain('Cadastrar "Com"');
    expect(await axeViolations(el, KNOWN_LIGHT_LABEL(mode))).toEqual([]);
    // The create option under the arrows (menu=create, hover on it).
    await userEvent.keyboard('{ArrowUp}');
    expect(activeOption(input)?.textContent).toBe('Cadastrar "Com"');
    expect(await axeViolations(el, KNOWN_LIGHT_LABEL(mode))).toEqual([]);
    // menu=empty-create: the create option alone, already active.
    await userEvent.clear(input);
    await userEvent.type(input, 'xyz');
    expect(activeOption(input)?.textContent).toBe('Cadastrar "xyz"');
    expect(await axeViolations(el, KNOWN_LIGHT_LABEL(mode))).toEqual([]);
  });

  it('the empty menu passes axe (menu=empty)', async () => {
    const el = await render(
      <div style={{ maxWidth: 320, paddingBottom: 120 }}>
        <Combobox label="Público" options={audiences} emptyMessage="Nenhum público com esse nome." />
      </div>,
      mode,
    );
    const input = field(el);
    input.focus();
    await userEvent.type(input, 'Lojistas BH');
    expect(el.querySelector('.rds-combobox__empty')?.textContent).toBe('Nenhum público com esse nome.');
    expect(listbox()).toBeNull();
    expect(await axeViolations(el, KNOWN_LIGHT_LABEL(mode))).toEqual([]);
  });

  it('is 44px tall, as the Input', async () => {
    const el = await render(<Combobox label="Público" options={audiences} />, mode);
    expect(el.querySelector<HTMLElement>('.rds-field__box')!.getBoundingClientRect().height).toBe(44);
  });
});

describe('Combobox behaviour', () => {
  it.fails('the top label on the rojao light theme passes axe (text/heading is flare-700)', async () => {
    const el = await render(<Combobox label="Público" options={audiences} />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('typing filters (ignoring accents and case), the arrows move past disabled, Enter chooses', async () => {
    const onValueChange = vi.fn();
    const el = await render(<Combobox label="Público" options={audiences} onValueChange={onValueChange} />);
    const input = field(el);
    expect(input.labels?.[0]?.textContent).toBe('Público');
    input.focus();
    await userEvent.type(input, 'compradores');
    const options = Array.from(listbox()!.querySelectorAll('[role="option"]')).map((o) => o.textContent);
    expect(options).toEqual(['Compradores SP', 'Compradores RJ']);
    expect(input.getAttribute('aria-expanded')).toBe('true');
    await vi.waitFor(() => expect(el.querySelector('[aria-live]')?.textContent).toBe('2 resultados'));
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(activeOption(input)?.textContent).toBe('Compradores RJ');
    await userEvent.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('Compradores RJ');
    expect(input.value).toBe('Compradores RJ');
    expect(listbox()).toBeNull();
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('the arrows skip a disabled option', async () => {
    const el = await render(<Combobox label="Público" options={audiences} />);
    const input = field(el);
    input.focus();
    await userEvent.keyboard('{ArrowUp}');
    // Up from nothing wraps to the last enabled option: Administradores is disabled.
    expect(activeOption(input)?.textContent).toBe('Lojistas SP');
  });

  it('Escape closes, and closed gives back the chosen text', async () => {
    const onValueChange = vi.fn();
    const el = await render(<Combobox label="Público" options={audiences} defaultValue="Comerciantes" onValueChange={onValueChange} />);
    const input = field(el);
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(listbox()).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    expect(listbox()).toBeNull();
    await userEvent.keyboard('{Backspace}{Backspace}');
    expect(input.value).toBe('Comerciant');
    await userEvent.keyboard('{Escape}{Escape}');
    expect(input.value).toBe('Comerciantes');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('menu=create: "Cadastrar" is an option after a divider, the arrows reach it and Enter creates', async () => {
    const onCreate = vi.fn((text: string) => ({ value: 'new-com', label: text }));
    const onValueChange = vi.fn();
    const el = await render(<Combobox label="Público" options={audiences} onCreate={onCreate} onValueChange={onValueChange} />);
    const input = field(el);
    input.focus();
    await userEvent.type(input, 'Com');
    const options = Array.from(listbox()!.querySelectorAll<HTMLElement>('[role="option"]'));
    expect(options.map((o) => o.textContent)).toEqual(['Compradores SP', 'Compradores RJ', 'Comerciantes', 'Cadastrar "Com"']);
    // With matches, nothing is active until the arrows move.
    expect(activeOption(input)).toBeNull();
    // The divider: the create option's top border, 1px in separator/line; it keeps the 44 of an option.
    const create = options[3];
    expect(getComputedStyle(create).borderTopWidth).toBe('1px');
    expect(getComputedStyle(create).borderTopStyle).toBe('solid');
    expect(getComputedStyle(options[2]).borderTopStyle).toBe('none');
    expect(create.getBoundingClientRect().height).toBe(44);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(activeOption(input)).toBe(create);
    expect(input.getAttribute('aria-activedescendant')).toBe(create.id);
    await userEvent.keyboard('{Enter}');
    expect(onCreate).toHaveBeenCalledWith('Com');
    expect(onValueChange).toHaveBeenLastCalledWith('new-com');
    expect(input.value).toBe('Com');
    expect(listbox()).toBeNull();
  });

  it('menu=create: Up from nothing wraps to "Cadastrar", the last option', async () => {
    const onCreate = vi.fn();
    const el = await render(<Combobox label="Público" options={audiences} onCreate={onCreate} />);
    const input = field(el);
    input.focus();
    await userEvent.type(input, 'Compradores');
    await userEvent.keyboard('{ArrowUp}');
    expect(activeOption(input)?.textContent).toBe('Cadastrar "Compradores"');
    await userEvent.keyboard('{Enter}');
    expect(onCreate).toHaveBeenCalledWith('Compradores');
  });

  it('menu=empty-create: with no match "Cadastrar" is the only option, already active, and Enter creates', async () => {
    const onCreate = vi.fn((text: string) => ({ value: 'new-1', label: text }));
    const onValueChange = vi.fn();
    const el = await render(<Combobox label="Público" options={audiences} onCreate={onCreate} onValueChange={onValueChange} />);
    const input = field(el);
    input.focus();
    await userEvent.type(input, 'Lojistas BH');
    const options = Array.from(listbox()!.querySelectorAll<HTMLElement>('[role="option"]'));
    expect(options.map((o) => o.textContent)).toEqual(['Cadastrar "Lojistas BH"']);
    // Alone, no divider.
    expect(getComputedStyle(options[0]).borderTopStyle).toBe('none');
    expect(activeOption(input)).toBe(options[0]);
    expect(el.querySelector('.rds-combobox__empty')).toBeNull();
    await userEvent.keyboard('{Enter}');
    expect(onCreate).toHaveBeenCalledWith('Lojistas BH');
    expect(onValueChange).toHaveBeenLastCalledWith('new-1');
    expect(input.value).toBe('Lojistas BH');
  });

  it('without onCreate or creatable there is no create option', async () => {
    const el = await render(<Combobox label="Público" options={audiences} />);
    const input = field(el);
    input.focus();
    await userEvent.type(input, 'Com');
    expect(el.textContent).not.toContain('Cadastrar');
    await userEvent.clear(input);
    await userEvent.type(input, 'Lojistas BH');
    expect(listbox()).toBeNull();
    expect(input.getAttribute('aria-activedescendant')).toBeNull();
  });

  it('multiple: Enter on the create option adds the new value as a chip', async () => {
    const onValueChange = vi.fn();
    const el = await render(<Combobox label="Públicos" options={audiences} multiple creatable onValueChange={onValueChange} />);
    const input = field(el);
    input.focus();
    await userEvent.type(input, 'Lojistas BH');
    await userEvent.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(['Lojistas BH']);
    expect(el.querySelectorAll('.rds-chip')).toHaveLength(1);
    expect(input.value).toBe('');
  });

  it('multiple: choosing toggles chips, the list stays open, Backspace removes the last', async () => {
    const onValueChange = vi.fn();
    const el = await render(<Combobox label="Públicos" options={audiences} multiple onValueChange={onValueChange} />);
    const input = field(el);
    input.focus();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(['Compradores SP']);
    expect(listbox()).not.toBeNull();
    expect(listbox()!.getAttribute('aria-multiselectable')).toBe('true');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(['Compradores SP', 'Compradores RJ']);
    expect(el.querySelectorAll('.rds-chip')).toHaveLength(2);
    await userEvent.keyboard('{Escape}{Backspace}');
    expect(onValueChange).toHaveBeenLastCalledWith(['Compradores SP']);
  });

  it('hint, error and required reach the field; disabled is the native one', async () => {
    const el = await render(
      <>
        <Combobox label="Público" options={audiences} hint="Quem recebe." required />
        <Combobox label="Público" options={audiences} errorMessage="Escolha um público." />
        <Combobox label="Público" options={audiences} disabled />
      </>,
    );
    const [a, b, c] = [field(el, 0), field(el, 1), field(el, 2)];
    expect(document.getElementById(a.getAttribute('aria-describedby')!)?.textContent).toBe('Quem recebe.');
    expect(a.getAttribute('aria-required')).toBe('true');
    expect(b.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(b.getAttribute('aria-describedby')!)?.textContent).toBe('Escolha um público.');
    expect(c.disabled).toBe(true);
  });
});
