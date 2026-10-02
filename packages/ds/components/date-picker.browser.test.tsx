import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { DatePicker } from './date-picker';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// The [RDS] maps input/label/color to text/heading, and the rojao light heading is flare-700 (#ff6a00, 2.9:1
// on white) for a 14px label. Kept out of the light axe matrix and pinned below until the Figma decides.
const KNOWN_LIGHT_LABEL = (mode: string) => (mode === 'light' ? ['.rds-field__label'] : []);
// The open Calendar's title is text/heading too (calendar/title): pinned in calendar.browser.test.tsx.
const KNOWN_LIGHT_OPEN = (mode: string) => (mode === 'light' ? ['.rds-field__label', '.rds-calendar__title'] : []);

const TODAY = '2026-09-30';
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const field = (el: HTMLElement) => el.querySelector<HTMLInputElement>('input')!;

describe.each(MODES)('DatePicker (%s)', (mode) => {
  it('every closed state passes axe: empty, filled, hint, error, nonexistent date, disabled, floating', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 334 }}>
        <DatePicker label="Data do disparo" />
        <DatePicker label="Data do disparo" defaultValue="2026-09-30" hint="Dia, mês e ano: dd/mm/aaaa." />
        <DatePicker label="Data do disparo" errorMessage="Escolha uma data a partir de hoje." />
        <DatePicker label="Data do disparo" disabled defaultValue="2026-09-30" />
        <DatePicker label="Data do disparo" labelPosition="floating" />
        <DatePicker label="Data do disparo" labelPosition="floating" defaultValue="2026-09-30" required />
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT_LABEL(mode))).toEqual([]);
  });

  it('the open calendar passes axe', async () => {
    const el = await render(<DatePicker label="Data do disparo" defaultValue="2026-09-15" today={TODAY} />, mode);
    el.querySelector<HTMLButtonElement>('[aria-label="Escolher data"]')!.click();
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    expect(await axeViolations(document.body, KNOWN_LIGHT_OPEN(mode))).toEqual([]);
  });
});

describe('DatePicker behaviour', () => {
  it.fails('the top label on the rojao light theme passes axe (text/heading is flare-700)', async () => {
    const el = await render(<DatePicker label="Data do disparo" />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('typing puts the slashes and gives the ISO date; a date that does not exist is an error', async () => {
    const onValueChange = vi.fn();
    const el = await render(<DatePicker label="Data do disparo" onValueChange={onValueChange} />);
    const input = field(el);
    input.focus();
    await userEvent.keyboard('30092026');
    expect(input.value).toBe('30/09/2026');
    expect(onValueChange).toHaveBeenLastCalledWith('2026-09-30');
    await userEvent.clear(input);
    expect(onValueChange).toHaveBeenLastCalledWith('');
    await userEvent.keyboard('31022026');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe(
      'Essa data não existe. Use dd/mm/aaaa.',
    );
  });

  it('the button opens the calendar on the chosen day; Enter on a day chooses, closes and gives the focus back', async () => {
    const onValueChange = vi.fn();
    const el = await render(<DatePicker label="Data do disparo" defaultValue="2026-09-15" today={TODAY} onValueChange={onValueChange} />);
    const input = field(el);
    const trigger = el.querySelector<HTMLButtonElement>('[aria-label="Escolher data"]')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    expect(dialog()!.getAttribute('aria-label')).toBe('Escolher data');
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toBe('15 de setembro de 2026'));
    await userEvent.keyboard('{ArrowRight}{PageDown}{Enter}');
    await vi.waitFor(() => expect(dialog()).toBeNull());
    expect(onValueChange).toHaveBeenLastCalledWith('2026-10-16');
    expect(input.value).toBe('16/10/2026');
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
  });

  it('Escape closes without choosing', async () => {
    const onValueChange = vi.fn();
    const el = await render(<DatePicker label="Data do disparo" today={TODAY} onValueChange={onValueChange} />);
    el.querySelector<HTMLButtonElement>('[aria-label="Escolher data"]')!.click();
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toBe('30 de setembro de 2026'));
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(dialog()).toBeNull());
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('disabled: the field and the button are the native disabled', async () => {
    const el = await render(<DatePicker label="Data do disparo" disabled />);
    expect(field(el).disabled).toBe(true);
    expect(el.querySelector<HTMLButtonElement>('[aria-label="Escolher data"]')!.disabled).toBe(true);
  });
});
