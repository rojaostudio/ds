import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { DateRangePicker, dateRangePresets } from './date-range-picker';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);
// The panel is a popover from lg (1024); below it, the Dialog's sheet.
beforeEach(async () => {
  await page.viewport(1280, 900);
});

const TODAY = '2026-10-10';
const panel = () => document.querySelector<HTMLElement>('[role="dialog"]');
const trigger = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('.rds-date-range-picker__trigger')!;
const announcer = () => document.querySelector('[data-rds-announcer]')?.textContent ?? '';

describe.each(MODES)('DateRangePicker (%s)', (mode) => {
  it('every closed state passes axe: empty, filled, hint, error, disabled', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
        <DateRangePicker label="Período" today={TODAY} />
        <DateRangePicker label="Período" today={TODAY} defaultValue={{ from: '2026-10-01', to: '2026-10-10' }} hint="Até 90 dias." />
        <DateRangePicker label="Período" today={TODAY} errorMessage="Escolha um período de até 90 dias." />
        <DateRangePicker label="Período" today={TODAY} disabled defaultValue={{ from: '2026-10-01', to: '2026-10-10' }} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the open panel (presets and the calendar in range) passes axe', async () => {
    const el = await render(<DateRangePicker label="Período" today={TODAY} defaultValue={{ from: '2026-10-04', to: '2026-10-10' }} />, mode);
    trigger(el).click();
    await vi.waitFor(() => expect(panel()).not.toBeNull());
    await settle();
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it('the compact sheet (presets as FilterChips, the calendar below) passes axe', async () => {
    await page.viewport(390, 800);
    const el = await render(<DateRangePicker label="Período" today={TODAY} defaultValue={{ from: '2026-10-04', to: '2026-10-10' }} />, mode);
    trigger(el).click();
    await vi.waitFor(() => expect(panel()).not.toBeNull());
    await settle();
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe('DateRangePicker behaviour', () => {
  it('the field shows the span and describes it in words', async () => {
    const el = await render(<DateRangePicker label="Período" today={TODAY} defaultValue={{ from: '2026-10-01', to: '2026-10-10' }} />);
    const button = trigger(el);
    expect(el.querySelector('.rds-date-range-picker__value')?.textContent).toBe('01/10/2026 – 10/10/2026');
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(document.getElementById(button.getAttribute('aria-describedby')!)?.textContent).toBe(
      'de 1 de outubro de 2026 a 10 de outubro de 2026',
    );
    // The label names the button.
    expect(el.querySelector(`label[for="${button.id}"]`)?.textContent).toBe('Período');
  });

  it('the default presets count from today', () => {
    expect(dateRangePresets(TODAY)).toEqual([
      { label: 'Hoje', range: { from: '2026-10-10', to: '2026-10-10' } },
      { label: 'Últimos 7 dias', range: { from: '2026-10-04', to: '2026-10-10' } },
      { label: 'Este mês', range: { from: '2026-10-01', to: '2026-10-10' } },
      { label: 'Mês passado', range: { from: '2026-09-01', to: '2026-09-30' } },
    ]);
  });

  it('keyboard: Enter opens on the presets; the arrows move, Enter chooses, closes, announces and gives the focus back', async () => {
    const onValueChange = vi.fn();
    const el = await render(<DateRangePicker label="Período" today={TODAY} onValueChange={onValueChange} />);
    trigger(el).focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(panel()).not.toBeNull());
    const listbox = panel()!.querySelector('[role="listbox"]')!;
    expect(listbox.getAttribute('aria-label')).toBe('Períodos');
    await vi.waitFor(() => expect(document.activeElement?.textContent).toBe('Hoje'));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toBe('Últimos 7 dias');
    await userEvent.keyboard('{End}');
    expect(document.activeElement?.textContent).toBe('Mês passado');
    await userEvent.keyboard('{ArrowUp}{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith({ from: '2026-10-01', to: '2026-10-10' });
    await vi.waitFor(() => expect(panel()).toBeNull());
    expect(document.activeElement).toBe(trigger(el));
    await vi.waitFor(() => expect(announcer()).toBe('Período escolhido: de 1 de outubro de 2026 a 10 de outubro de 2026'));
    expect(el.querySelector('.rds-date-range-picker__value')?.textContent).toBe('01/10/2026 – 10/10/2026');
  });

  it('the chosen preset is the selected option, with the check; Tab goes from the presets to the calendar', async () => {
    const el = await render(<DateRangePicker label="Período" today={TODAY} defaultValue={{ from: '2026-09-01', to: '2026-09-30' }} />);
    trigger(el).click();
    await vi.waitFor(() => expect(panel()).not.toBeNull());
    const selected = panel()!.querySelector('[role="option"][aria-selected="true"]')!;
    expect(selected.textContent).toBe('Mês passado');
    expect(selected.querySelector('svg')).not.toBeNull();
    await vi.waitFor(() => expect(document.activeElement).toBe(selected));
    // Past the month arrows, the day of the span's start.
    await userEvent.keyboard('{Tab}{Tab}{Tab}');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('1 de setembro de 2026, início do período');
  });

  it('in the calendar by keyboard: the start is announced in the panel, the end sets the span and closes', async () => {
    const onValueChange = vi.fn();
    const el = await render(<DateRangePicker label="Período" today={TODAY} presets={[]} onValueChange={onValueChange} />);
    trigger(el).click();
    await vi.waitFor(() => expect(panel()).not.toBeNull());
    expect(panel()!.querySelector('[role="listbox"]')).toBeNull();
    panel()!.querySelector<HTMLButtonElement>('.rds-calendar__day[tabindex="0"]')!.focus();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{Enter}');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(panel()!.querySelector('[role="status"]')?.textContent).toBe('Início em 8 de outubro de 2026. Agora escolha o fim.');
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith({ from: '2026-10-08', to: '2026-10-09' });
    await vi.waitFor(() => expect(panel()).toBeNull());
    expect(document.activeElement).toBe(trigger(el));
  });

  it('Escape closes without changing the span', async () => {
    const onValueChange = vi.fn();
    const el = await render(
      <DateRangePicker label="Período" today={TODAY} defaultValue={{ from: '2026-10-01', to: '2026-10-10' }} onValueChange={onValueChange} />,
    );
    trigger(el).click();
    await vi.waitFor(() => expect(panel()).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(panel()).toBeNull());
    expect(onValueChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger(el));
  });

  it('accepts its own presets', async () => {
    const onValueChange = vi.fn();
    const el = await render(
      <DateRangePicker
        label="Período"
        today={TODAY}
        presets={[{ label: 'Trimestre', range: { from: '2026-07-01', to: '2026-09-30' } }]}
        onValueChange={onValueChange}
      />,
    );
    trigger(el).click();
    await vi.waitFor(() => expect(panel()).not.toBeNull());
    const options = [...panel()!.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options.map((o) => o.textContent)).toEqual(['Trimestre']);
    options[0].click();
    expect(onValueChange).toHaveBeenLastCalledWith({ from: '2026-07-01', to: '2026-09-30' });
  });

  it('compact: the panel is the bottom sheet, presets as FilterChips on top, a chip sets the span', async () => {
    await page.viewport(390, 800);
    const onValueChange = vi.fn();
    const el = await render(<DateRangePicker label="Período" today={TODAY} onValueChange={onValueChange} />);
    trigger(el).focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(panel()).not.toBeNull());
    const sheet = panel()!;
    expect(sheet.classList).toContain('rds-dialog');
    expect(sheet.getAttribute('aria-modal')).toBe('true');
    const chips = sheet.querySelector('[role="group"][aria-label="Períodos"]')!;
    const calendar = sheet.querySelector('.rds-calendar')!;
    expect(chips.getBoundingClientRect().bottom).toBeLessThanOrEqual(calendar.getBoundingClientRect().top);
    await settle();
    expect(Math.round(sheet.getBoundingClientRect().bottom)).toBe(800);
    // The focus opens on the first chip.
    await vi.waitFor(() => expect(document.activeElement?.textContent).toBe('Hoje'));
    await userEvent.keyboard('{Tab}{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith({ from: '2026-10-04', to: '2026-10-10' });
    await vi.waitFor(() => expect(panel()).toBeNull());
    expect(document.activeElement).toBe(trigger(el));
  });
});
