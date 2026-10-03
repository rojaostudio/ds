import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Select, SelectItem } from './select';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);


const Pin = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const states = () => [
  <SelectItem key="sp" value="sp">São Paulo</SelectItem>,
  <SelectItem key="rj" value="rj">Rio de Janeiro</SelectItem>,
  <SelectItem key="mg" value="mg" disabled>Minas Gerais</SelectItem>,
  <SelectItem key="pr" value="pr" icon={<Pin />}>Paraná</SelectItem>,
];

const listbox = () => document.querySelector<HTMLElement>('[role="listbox"]');

describe.each(MODES)('Select (%s)', (mode) => {
  it('every closed state passes axe: empty, chosen, hint, error, disabled, required, floating, icon', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
        <Select label="Estado">{states()}</Select>
        <Select label="Estado" defaultValue="sp">{states()}</Select>
        <Select label="Estado" hint="Onde você mora hoje.">{states()}</Select>
        <Select label="Estado" errorMessage="Escolha um estado.">{states()}</Select>
        <Select label="Estado" disabled>{states()}</Select>
        <Select label="Estado" disabled defaultValue="sp">{states()}</Select>
        <Select label="Estado" required>{states()}</Select>
        <Select label="Estado" labelPosition="floating">{states()}</Select>
        <Select label="Estado" labelPosition="floating" defaultValue="rj">{states()}</Select>
        <Select label="Estado" leadingIcon={<Pin />}>{states()}</Select>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the open list passes axe, with a chosen, a highlighted and a disabled option', async () => {
    const el = await render(
      <Select label="Estado" defaultValue="sp">
        {states()}
      </Select>,
      mode,
    );
    el.querySelector<HTMLButtonElement>('[role="combobox"]')!.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(listbox()).not.toBeNull());
    await userEvent.keyboard('{ArrowDown}');
    expect(await axeViolations(listbox()!)).toEqual([]);
    await userEvent.keyboard('{Escape}');
  });

  it('is 44px tall, 56px with the floating label', async () => {
    const el = await render(
      <>
        <Select label="Estado">{states()}</Select>
        <Select label="Estado" labelPosition="floating">{states()}</Select>
      </>,
      mode,
    );
    const [top, floating] = Array.from(el.querySelectorAll<HTMLElement>('.rds-field__box'));
    expect(top.getBoundingClientRect().height).toBe(44);
    expect(floating.getBoundingClientRect().height).toBe(56);
  });
});

describe('Select behaviour', () => {
  it('the top label (select/label/color → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<Select label="Estado">{states()}</Select>, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the label names the combobox; hint, error and required reach it', async () => {
    const el = await render(
      <>
        <Select label="Estado" hint="Onde você mora hoje." required>
          {states()}
        </Select>
        <Select label="Cidade" errorMessage="Escolha uma cidade.">
          {states()}
        </Select>
      </>,
    );
    const [a, b] = Array.from(el.querySelectorAll<HTMLButtonElement>('[role="combobox"]'));
    expect(a.labels?.[0]?.textContent).toContain('Estado');
    expect(a.getAttribute('aria-required')).toBe('true');
    expect(a.getAttribute('aria-invalid')).toBeNull();
    expect(document.getElementById(a.getAttribute('aria-describedby')!)?.textContent).toBe('Onde você mora hoje.');
    expect(b.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(b.getAttribute('aria-describedby')!)?.textContent).toBe('Escolha uma cidade.');
  });

  it('opens, moves past disabled options and chooses with the keyboard', async () => {
    const onValueChange = vi.fn();
    const el = await render(
      <Select label="Estado" onValueChange={onValueChange}>
        {states()}
      </Select>,
    );
    const trigger = el.querySelector<HTMLButtonElement>('[role="combobox"]')!;
    expect(trigger.textContent).toContain('Selecione');
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await vi.waitFor(() => expect(listbox()).not.toBeNull());
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    // Opened without a value, the first option is active; down twice skips Minas Gerais (disabled).
    await vi.waitFor(() => expect(document.activeElement?.textContent).toBe('São Paulo'));
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toBe('Paraná');
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(listbox()).toBeNull());
    expect(onValueChange).toHaveBeenLastCalledWith('pr');
    expect(trigger.textContent).toContain('Paraná');
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('Escape closes without choosing; disabled does not open', async () => {
    const onValueChange = vi.fn();
    const el = await render(
      <>
        <Select label="Estado" onValueChange={onValueChange}>
          {states()}
        </Select>
        <Select label="Cidade" disabled>
          {states()}
        </Select>
      </>,
    );
    const [open, off] = Array.from(el.querySelectorAll<HTMLButtonElement>('[role="combobox"]'));
    open.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(listbox()).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(listbox()).toBeNull());
    expect(onValueChange).not.toHaveBeenCalled();
    expect(off.disabled).toBe(true);
  });
});
