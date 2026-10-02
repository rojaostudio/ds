import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { TimePicker, formatTime, parseTime } from './time-picker';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// The [RDS] maps input/label/color to text/heading, and the rojao light heading is flare-700 (#ff6a00, 2.9:1
// on white) for a 14px label. Kept out of the light axe matrix and pinned below until the Figma decides.
const KNOWN_LIGHT_LABEL = (mode: string) => (mode === 'light' ? ['.rds-field__label'] : []);

const field = (el: HTMLElement) => el.querySelector<HTMLInputElement>('[role="combobox"]')!;
const listbox = () => document.querySelector<HTMLElement>('[role="listbox"]');
const activeOption = (input: HTMLInputElement) => document.getElementById(input.getAttribute('aria-activedescendant') ?? '');

describe.each(MODES)('TimePicker (%s)', (mode) => {
  it('every closed state passes axe: empty, filled, hint, error, required, disabled, floating', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 280 }}>
        <TimePicker label="Horário" />
        <TimePicker label="Horário" defaultValue="09:30" hint="Das 8h às 18h." required />
        <TimePicker label="Horário" defaultValue="07:00" errorMessage="Escolha a partir das 08:00." />
        <TimePicker label="Horário" defaultValue="09:30" disabled />
        <TimePicker label="Horário" labelPosition="floating" />
        <TimePicker label="Horário" defaultValue="14:30" format="12h" />
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT_LABEL(mode))).toEqual([]);
  });

  it('the open list passes axe', async () => {
    const el = await render(
      <div style={{ maxWidth: 280, paddingBottom: 260 }}>
        <TimePicker label="Horário" defaultValue="09:30" min="09:00" max="11:00" />
      </div>,
      mode,
    );
    field(el).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(listbox()).not.toBeNull();
    expect(await axeViolations(el, KNOWN_LIGHT_LABEL(mode))).toEqual([]);
  });
});

describe('TimePicker behaviour', () => {
  it.fails('the top label on the rojao light theme passes axe (text/heading is flare-700)', async () => {
    const el = await render(<TimePicker label="Horário" />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('parses and formats times', () => {
    expect(parseTime('9:30')).toBe('09:30');
    expect(parseTime('0930')).toBe('09:30');
    expect(parseTime('2:30 pm')).toBe('14:30');
    expect(parseTime('12:00 AM')).toBe('00:00');
    expect(parseTime('25:00')).toBeNull();
    expect(formatTime('14:30', '12h')).toBe('02:30 PM');
    expect(formatTime('00:15', '12h')).toBe('12:15 AM');
  });

  it('a combobox: the arrows open the list on the chosen time, walk it, Enter chooses and closes', async () => {
    const onChange = vi.fn();
    const el = await render(
      <div style={{ paddingBottom: 260 }}>
        <TimePicker label="Horário" defaultValue="09:30" min="09:00" max="11:00" onChange={onChange} />
      </div>,
    );
    const input = field(el);
    expect(input.getAttribute('aria-expanded')).toBe('false');
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-controls')).toBe(listbox()!.id);
    expect(Array.from(listbox()!.querySelectorAll('[role="option"]')).map((o) => o.textContent)).toEqual([
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
    ]);
    expect(activeOption(input)?.textContent).toBe('09:30');
    expect(activeOption(input)?.getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('10:30');
    expect(input.value).toBe('10:30');
    expect(listbox()).toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it('Escape closes without changing', async () => {
    const onChange = vi.fn();
    const el = await render(<TimePicker label="Horário" defaultValue="09:30" onChange={onChange} />);
    const input = field(el);
    input.focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Escape}');
    expect(listbox()).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('09:30');
  });

  it('typing HH:mm: the colon comes by itself; an impossible or out-of-range time is an error', async () => {
    const onChange = vi.fn();
    const el = await render(<TimePicker label="Horário" min="08:00" max="18:00" onChange={onChange} />);
    const input = field(el);
    input.focus();
    await userEvent.keyboard('1415');
    expect(input.value).toBe('14:15');
    expect(onChange).toHaveBeenLastCalledWith('14:15');
    await userEvent.clear(input);
    expect(onChange).toHaveBeenLastCalledWith(null);
    await userEvent.keyboard('2500');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe('Essa hora não existe. Use HH:mm.');
    await userEvent.clear(input);
    await userEvent.keyboard('0700');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('a click on the clock opens the list, keeping the focus in the field; the step sets the list', async () => {
    const el = await render(
      <div style={{ paddingBottom: 260 }}>
        <TimePicker label="Horário" step={15} min="10:00" max="11:00" />
      </div>,
    );
    await userEvent.click(el.querySelector<HTMLElement>('.rds-time-picker__clock')!);
    expect(document.activeElement).toBe(field(el));
    expect(listbox()!.querySelectorAll('[role="option"]')).toHaveLength(5);
    await userEvent.click(listbox()!.querySelectorAll<HTMLElement>('[role="option"]')[1]);
    expect(field(el).value).toBe('10:15');
  });

  it('12h shows AM/PM; the value stays 24 h; name carries it', async () => {
    const onChange = vi.fn();
    const el = await render(
      <div style={{ paddingBottom: 260 }}>
        <TimePicker label="Horário" defaultValue="14:00" format="12h" min="14:00" max="15:00" name="hora" onChange={onChange} />
      </div>,
    );
    const input = field(el);
    expect(input.value).toBe('02:00 PM');
    expect(el.querySelector<HTMLInputElement>('input[name="hora"]')!.value).toBe('14:00');
    input.focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('14:30');
    expect(input.value).toBe('02:30 PM');
  });

  it('disabled is the native one and does not open', async () => {
    const el = await render(<TimePicker label="Horário" defaultValue="09:30" disabled />);
    expect(field(el).disabled).toBe(true);
    await userEvent.click(el.querySelector<HTMLElement>('.rds-time-picker__clock')!, { force: true });
    expect(listbox()).toBeNull();
  });
});
