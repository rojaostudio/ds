import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Listbox, ListboxOption } from './listbox';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const Pin = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const states = () => [
  <ListboxOption key="ba" value="ba">Bahia</ListboxOption>,
  <ListboxOption key="mg" value="mg" icon={<Pin />}>Minas Gerais</ListboxOption>,
  <ListboxOption key="pr" value="pr">Paraná</ListboxOption>,
  <ListboxOption key="sp" value="sp">São Paulo</ListboxOption>,
  <ListboxOption key="to" value="to" disabled>Tocantins</ListboxOption>,
];

const active = (el: HTMLElement) => document.getElementById(el.querySelector('[role="listbox"]')!.getAttribute('aria-activedescendant')!);

describe.each(MODES)('Listbox (%s)', (mode) => {
  it('with a chosen, an active and a disabled option passes axe', async () => {
    const el = await render(
      <Listbox aria-label="Estado" defaultValue="sp" style={{ maxWidth: 280 }}>
        {states()}
      </Listbox>,
      mode,
    );
    el.querySelector<HTMLElement>('[role="listbox"]')!.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Listbox behaviour', () => {
  it('the focus enters on the chosen option; the arrows skip disabled; Enter chooses', async () => {
    const onValueChange = vi.fn();
    const el = await render(
      <Listbox aria-label="Estado" defaultValue="mg" onValueChange={onValueChange}>
        {states()}
      </Listbox>,
    );
    const list = el.querySelector<HTMLElement>('[role="listbox"]')!;
    list.focus();
    await vi.waitFor(() => expect(active(el)?.textContent).toBe('Minas Gerais'));
    await userEvent.keyboard('{End}');
    expect(active(el)?.textContent).toBe('São Paulo');
    await userEvent.keyboard('{Home}{ArrowDown}{ArrowDown}');
    expect(active(el)?.textContent).toBe('Paraná');
    await userEvent.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('pr');
    expect(el.querySelector('[aria-selected="true"]')?.textContent).toBe('Paraná');
    await userEvent.keyboard('{ArrowUp}{ }');
    expect(onValueChange).toHaveBeenLastCalledWith('mg');
  });

  it('a click chooses; a disabled option does not', async () => {
    const onValueChange = vi.fn();
    const el = await render(
      <Listbox aria-label="Estado" onValueChange={onValueChange}>
        {states()}
      </Listbox>,
    );
    const options = Array.from(el.querySelectorAll<HTMLElement>('[role="option"]'));
    options[4].click();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(options[4].getAttribute('aria-disabled')).toBe('true');
    options[0].click();
    expect(onValueChange).toHaveBeenLastCalledWith('ba');
  });
});
