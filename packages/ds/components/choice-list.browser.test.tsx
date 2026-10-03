import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Avatar } from './avatar';
import { ChoiceList, ChoiceListItem } from './choice-list';
import { MODES, axeViolations, cleanup, cssVar, render } from './__tests__/render';

afterEach(cleanup);

const clients = () => [
  <ChoiceListItem key="ana" value="ana" media={<Avatar name="Ana Souza" />} title="Ana Souza" description="Cliente desde 2023 · 12 pedidos" trailing="R$ 1.240,00" />,
  <ChoiceListItem key="bruno" value="bruno" media={<Avatar name="Bruno Lima" />} title="Bruno Lima" description="Cliente desde 2021 · 30 pedidos" trailing="R$ 3.980,50" />,
  <ChoiceListItem key="carla" value="carla" media={<Avatar name="Carla Mendes" />} title="Carla Mendes" description="Cliente desde 2024 · 2 pedidos" trailing="R$ 186,90" />,
  <ChoiceListItem key="diego" value="diego" title="Diego Rocha" trailing="R$ 742,00" />,
  <ChoiceListItem key="elisa" value="elisa" media={<Avatar name="Elisa Prado" />} title="Elisa Prado" description="Conta suspensa" trailing="R$ 0,00" disabled />,
];

const list = (el: HTMLElement) => el.querySelector<HTMLElement>('[role="listbox"]')!;
const rows = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>('[role="option"]'));
const active = (el: HTMLElement) => document.getElementById(list(el).getAttribute('aria-activedescendant')!);
const title = (row: Element | null) => row?.querySelector('.rds-choice-list__title')?.textContent;

describe.each(MODES)('ChoiceList (%s)', (mode) => {
  it('with a chosen, an active (focus ring) and a disabled row passes axe', async () => {
    const el = await render(
      <ChoiceList aria-label="Clientes" defaultValue="bruno" style={{ maxWidth: 400 }}>
        {clients()}
      </ChoiceList>,
      mode,
    );
    list(el).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('a hovered row passes axe', async () => {
    const el = await render(
      <ChoiceList aria-label="Clientes" style={{ maxWidth: 400 }}>
        {clients()}
      </ChoiceList>,
      mode,
    );
    await userEvent.hover(rows(el)[2]);
    expect(getComputedStyle(rows(el)[2]).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('ChoiceList behaviour', () => {
  it('is a listbox of options; the title names the row, description and trailing describe it; media is hidden', async () => {
    const el = await render(<ChoiceList aria-label="Clientes">{clients()}</ChoiceList>);
    expect(list(el).getAttribute('tabindex')).toBe('0');
    const [ana, , , diego] = rows(el);
    expect(document.getElementById(ana.getAttribute('aria-labelledby')!)?.textContent).toBe('Ana Souza');
    const described = ana.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)?.textContent);
    expect(described).toEqual(['Cliente desde 2023 · 12 pedidos', 'R$ 1.240,00']);
    expect(ana.querySelector('.rds-choice-list__media')?.getAttribute('aria-hidden')).toBe('true');
    expect(diego.querySelector('.rds-choice-list__media')).toBeNull();
    expect(diego.getAttribute('aria-describedby')?.split(' ')).toHaveLength(1);
  });

  it('a click chooses, one at a time; a disabled row does not', async () => {
    const onValueChange = vi.fn();
    const el = await render(
      <ChoiceList aria-label="Clientes" onValueChange={onValueChange}>
        {clients()}
      </ChoiceList>,
    );
    const all = rows(el);
    await userEvent.click(all[1]);
    expect(onValueChange).toHaveBeenLastCalledWith('bruno');
    await userEvent.click(all[2]);
    expect(onValueChange).toHaveBeenLastCalledWith('carla');
    expect(el.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
    expect(title(el.querySelector('[aria-selected="true"]'))).toBe('Carla Mendes');
    all[4].click();
    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(all[4].getAttribute('aria-disabled')).toBe('true');
  });

  it('the focus enters on the chosen row; the arrows skip disabled; Home, End; Enter and Space choose', async () => {
    const onValueChange = vi.fn();
    const el = await render(
      <ChoiceList aria-label="Clientes" defaultValue="bruno" onValueChange={onValueChange}>
        {clients()}
      </ChoiceList>,
    );
    list(el).focus();
    await vi.waitFor(() => expect(title(active(el))).toBe('Bruno Lima'));
    await userEvent.keyboard('{End}');
    expect(title(active(el))).toBe('Diego Rocha');
    await userEvent.keyboard('{ArrowDown}');
    expect(title(active(el))).toBe('Diego Rocha');
    await userEvent.keyboard('{Home}{ArrowDown}{ArrowDown}');
    expect(title(active(el))).toBe('Carla Mendes');
    await userEvent.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('carla');
    expect(title(el.querySelector('[aria-selected="true"]'))).toBe('Carla Mendes');
    await userEvent.keyboard('{ArrowUp}{ }');
    expect(onValueChange).toHaveBeenLastCalledWith('bruno');
  });

  it('controlled: value decides the chosen row', async () => {
    function Controlled() {
      const [value, setValue] = useState('ana');
      return (
        <>
          <p data-testid="chosen">{value}</p>
          <ChoiceList aria-label="Clientes" value={value} onValueChange={setValue}>
            {clients()}
          </ChoiceList>
        </>
      );
    }
    const el = await render(<Controlled />);
    expect(title(el.querySelector('[aria-selected="true"]'))).toBe('Ana Souza');
    await userEvent.click(rows(el)[3]);
    expect(el.querySelector('[data-testid="chosen"]')?.textContent).toBe('diego');
    expect(title(el.querySelector('[aria-selected="true"]'))).toBe('Diego Rocha');
  });

  it('states: line only at the bottom, the chosen row gets the tint and the bar, the active row the ring when focused by keyboard', async () => {
    const el = await render(
      <ChoiceList aria-label="Clientes" defaultValue="ana" style={{ maxWidth: 400 }}>
        {clients()}
      </ChoiceList>,
    );
    const [ana, bruno, , , elisa] = rows(el);
    const style = getComputedStyle(bruno);
    expect(style.borderTopWidth).toBe('0px');
    expect(style.borderLeftWidth).toBe('0px');
    expect(style.borderBottomWidth).toBe('1px');
    expect(style.borderBottomLeftRadius).toBe('0px');
    expect(style.paddingLeft).toBe('16px');
    expect(bruno.getBoundingClientRect().height).toBe(60);
    expect(rows(el)[3].getBoundingClientRect().height).toBe(44);

    const chosen = getComputedStyle(ana);
    expect(chosen.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(chosen.boxShadow).toContain('inset');
    expect(cssVar('--choice-list-item-background-selected')).not.toBe('');

    expect(getComputedStyle(elisa).cursor).toBe('not-allowed');
    expect(getComputedStyle(elisa.querySelector('.rds-choice-list__media')!).opacity).toBe('0.5');

    expect(getComputedStyle(ana).outlineStyle).toBe('none');
    await userEvent.tab();
    expect(document.activeElement).toBe(list(el));
    await vi.waitFor(() => expect(getComputedStyle(ana).outlineStyle).toBe('solid'));
    expect(getComputedStyle(ana).outlineWidth).toBe('2px');
    await userEvent.keyboard('{ArrowDown}');
    expect(getComputedStyle(ana).outlineStyle).toBe('none');
    expect(getComputedStyle(bruno).outlineStyle).toBe('solid');
  });
});
