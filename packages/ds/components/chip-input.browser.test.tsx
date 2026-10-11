import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { userEvent } from 'vitest/browser';
import { ChipInput } from './chip-input';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

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
    expect(await axeViolations(el)).toEqual([]);
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
    expect(await axeViolations(el)).toEqual([]);
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
  it('the top label on the rojao light theme passes axe', async () => {
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

});

const OPTIONS = ['Branco', 'Amarelo', 'Azul'];
const IN_USE: Record<string, number> = { Branco: 2 };
const usage = (value: string) =>
  IN_USE[value] ? { locked: true, count: IN_USE[value], tooltip: `Usada em ${IN_USE[value]} produtos` } : {};
const chip = (el: HTMLElement, name: string) =>
  Array.from(el.querySelectorAll<HTMLElement>('.rds-chip')).find(
    (c) => c.querySelector('.rds-chip__label')?.textContent === name,
  )!;
const wait = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

function Options(props: { onChange?: (next: string[]) => void }) {
  const [value, setValue] = useState(OPTIONS);
  return (
    <ChipInput
      label="Cor"
      layout="list"
      addLabel="Opção"
      reorderable
      editable
      getChipProps={usage}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange?.(next);
      }}
    />
  );
}

describe.each(MODES)('ChipInput list (%s)', (mode) => {
  it('passes axe: locked with count, free, the "+", empty and disabled', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 320 }}>
        <Options />
        <ChipInput label="Sabor" layout="list" addLabel="Opção" hint="Arraste para mudar a ordem." />
        <ChipInput label="Cor" layout="list" disabled defaultValue={OPTIONS} getChipProps={usage} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('ChipInput list behaviour', () => {
  it('no box: chips and the "+" are 32 tall, 8 apart, the "+" closes the row', async () => {
    const el = await render(
      <div style={{ width: 320 }}>
        <Options />
      </div>,
    );
    const box = el.querySelector<HTMLElement>('.rds-field__box')!;
    expect(getComputedStyle(box).borderTopWidth).toBe('0px');
    const pills = Array.from(el.querySelectorAll<HTMLElement>('.rds-chip'));
    expect(pills.map((p) => p.getBoundingClientRect().height)).toEqual([32, 32, 32, 32]);
    expect(pills.at(-1)!.textContent).toBe('Opção');
    expect(pills[1].getBoundingClientRect().left - pills[0].getBoundingClientRect().right).toBe(8);
  });

  it('a locked value: no ×, the count inside the pill, a Tooltip on focus; the free ones keep the ×', async () => {
    const el = await render(<Options />);
    const branco = chip(el, 'Branco');
    expect(branco.querySelector('.rds-chip__remove')).toBeNull();
    expect(branco.querySelector('.rds-chip__count')!.textContent).toBe('· 2');
    expect(chip(el, 'Azul').querySelector('.rds-chip__remove')).not.toBeNull();
    await userEvent.tab();
    expect(document.activeElement).toBe(branco);
    await expect.poll(() => document.querySelector('[role="tooltip"]')?.textContent).toBe('Usada em 2 produtos');
    // Enter does not rename a locked value; Delete does not remove it.
    await userEvent.keyboard('{Enter}{Delete}');
    expect(el.querySelector('.rds-chip--editing')).toBeNull();
    expect(chips(el)).toEqual([...OPTIONS, 'Opção']);
  });

  it('the "+" turns into a field of its size: Enter adds and stays, Escape closes back to the "+"', async () => {
    const onChange = vi.fn();
    const el = await render(<Options onChange={onChange} />);
    await userEvent.click(el.querySelector<HTMLButtonElement>('.rds-chip-input__add')!);
    const input = el.querySelector<HTMLInputElement>('.rds-chip-input__add .rds-chip__input')!;
    expect(document.activeElement).toBe(input);
    expect(input.labels?.[0]?.textContent).toBe('Cor');
    expect(el.querySelector<HTMLElement>('.rds-chip-input__add')!.getBoundingClientRect().height).toBe(32);
    await userEvent.keyboard('Verde{Enter}');
    expect(onChange).toHaveBeenLastCalledWith([...OPTIONS, 'Verde']);
    expect(document.activeElement).toBe(el.querySelector('.rds-chip-input__add .rds-chip__input'));
    await userEvent.keyboard('{Enter}');
    await wait();
    expect(el.querySelector('.rds-chip-input__add .rds-chip__input')).toBeNull();
    expect(document.activeElement).toBe(el.querySelector('button.rds-chip-input__add'));
    await userEvent.click(el.querySelector<HTMLButtonElement>('button.rds-chip-input__add')!);
    await userEvent.keyboard('Rosa{Escape}');
    await wait();
    expect(chips(el)).toEqual([...OPTIONS, 'Verde', 'Opção']);
  });

  it('editing a free name in place: Enter saves, a repeated name is refused, Escape cancels', async () => {
    const onChange = vi.fn();
    const el = await render(<Options onChange={onChange} />);
    await userEvent.click(chip(el, 'Azul').querySelector('.rds-chip__label')!);
    const input = el.querySelector<HTMLInputElement>('.rds-chip--editing .rds-chip__input')!;
    expect(document.activeElement).toBe(input);
    await userEvent.fill(input, 'Amarelo');
    await userEvent.keyboard('{Enter}');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.fill(input, 'Azul-claro');
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['Branco', 'Amarelo', 'Azul-claro']);
    await wait();
    expect(document.activeElement).toBe(chip(el, 'Azul-claro'));
    await userEvent.keyboard('{F2}');
    await userEvent.fill(el.querySelector<HTMLInputElement>('.rds-chip--editing .rds-chip__input')!, 'Turquesa');
    await userEvent.keyboard('{Escape}');
    expect(chips(el)).toEqual(['Branco', 'Amarelo', 'Azul-claro', 'Opção']);
    // A locked value does not open the field on a click.
    await userEvent.click(chip(el, 'Branco').querySelector('.rds-chip__label')!);
    expect(el.querySelector('.rds-chip--editing')).toBeNull();
  });

  it('keyboard reorder: Space picks up, the arrows move, Space drops; Escape puts it back', async () => {
    const onChange = vi.fn();
    const el = await render(<Options onChange={onChange} />);
    chip(el, 'Branco').focus();
    await userEvent.keyboard(' {ArrowRight}{ArrowRight} ');
    expect(onChange).toHaveBeenLastCalledWith(['Amarelo', 'Azul', 'Branco']);
    expect(document.activeElement).toBe(chip(el, 'Branco'));
    await userEvent.keyboard(' {ArrowLeft}{Escape}');
    expect(chips(el)).toEqual(['Amarelo', 'Azul', 'Branco', 'Opção']);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('dragging a chip with the mouse moves it where it is dropped, and the drop is not a click', async () => {
    const onChange = vi.fn();
    const el = await render(<Options onChange={onChange} />);
    const from = chip(el, 'Azul').getBoundingClientRect();
    const to = chip(el, 'Branco').getBoundingClientRect();
    const at = (type: string, x: number, y: number, target: EventTarget) =>
      target.dispatchEvent(
        new PointerEvent(type, { clientX: x, clientY: y, pointerId: 7, pointerType: 'mouse', button: 0, bubbles: true }),
      );
    at('pointerdown', from.left + 4, from.top + 16, chip(el, 'Azul').querySelector('.rds-chip__label')!);
    at('pointermove', from.left - 10, from.top + 16, window);
    await wait();
    at('pointermove', to.left + 4, to.top + 16, window);
    await wait();
    expect(chip(el, 'Azul').classList.contains('rds-chip--dragging')).toBe(true);
    at('pointerup', to.left + 4, to.top + 16, window);
    await wait();
    expect(onChange).toHaveBeenLastCalledWith(['Azul', 'Branco', 'Amarelo']);
    expect(el.querySelector('.rds-chip--dragging')).toBeNull();
    expect(el.querySelector('.rds-chip--editing')).toBeNull();
  });

  it('max hides the "+"; disabled has neither the "+" nor movement', async () => {
    const el = await render(
      <>
        <ChipInput label="Cor" layout="list" max={3} defaultValue={OPTIONS} />
        <ChipInput label="Cor" layout="list" disabled reorderable defaultValue={OPTIONS} />
      </>,
    );
    expect(el.querySelectorAll('.rds-chip-input__add')).toHaveLength(0);
    expect(el.querySelectorAll('.rds-chip[tabindex]')).toHaveLength(0);
  });

  it('size md: the Chips and the "+" are 44 (list on a phone)', async () => {
    const el = await render(<ChipInput label="Cor" layout="list" size="md" addLabel="Opção" defaultValue={OPTIONS} />);
    const pills = Array.from(el.querySelectorAll<HTMLElement>('.rds-chip'));
    expect(pills.map((p) => p.getBoundingClientRect().height)).toEqual([44, 44, 44, 44]);
  });

  it('without dragging (WCAG 2.5.7): hold a chip still, let go, then tap where it goes', async () => {
    const onChange = vi.fn();
    const el = await render(<Options onChange={onChange} />);
    const azul = chip(el, 'Azul');
    const box = azul.getBoundingClientRect();
    azul.dispatchEvent(new PointerEvent('pointerdown', { clientX: box.left + 4, clientY: box.top + 8, pointerId: 9, pointerType: 'touch', button: 0, bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 450));
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: box.left + 4, clientY: box.top + 8, pointerId: 9, pointerType: 'touch', button: 0, bubbles: true }));
    await wait();
    expect(chip(el, 'Azul').classList.contains('rds-chip--dragging')).toBe(true);
    const branco = chip(el, 'Branco');
    branco.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 10, pointerType: 'touch', button: 0, bubbles: true }));
    await wait();
    expect(onChange).toHaveBeenLastCalledWith(['Azul', 'Branco', 'Amarelo']);
    expect(el.querySelector('.rds-chip--dragging')).toBeNull();
  });

  it('field: the Chips keep the box padding (4 on top, 8 on the left) when they wrap; field.css does not override it', async () => {
    const el = await render(
      <div style={{ width: 430 }}>
        <ChipInput label="Etiquetas" defaultValue={['Presente', 'ascal', 'mnbsgsh', 'jhs', 'jhsjhsj']} />
      </div>,
    );
    const box = el.querySelector<HTMLElement>('.rds-field__box')!;
    const b = box.getBoundingClientRect();
    const first = box.querySelector<HTMLElement>('.rds-chip')!.getBoundingClientRect();
    const last = Array.from(box.querySelectorAll<HTMLElement>('.rds-chip')).at(-1)!.getBoundingClientRect();
    // 1 border + 4 padding.
    expect(Math.round(first.top - b.top)).toBe(5);
    expect(Math.round(first.left - b.left)).toBe(9);
    expect(getComputedStyle(box).rowGap).toBe('4px');
    expect(Math.round(b.bottom - Math.max(last.bottom, box.querySelector('input')!.getBoundingClientRect().bottom))).toBeGreaterThanOrEqual(5);
  });
});

