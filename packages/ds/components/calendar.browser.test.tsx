import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Calendar } from './calendar';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const TODAY = '2026-09-30';
const weekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
const focusedDay = () => document.activeElement?.getAttribute('aria-label');

describe.each(MODES)('Calendar (%s)', (mode) => {
  it('a month with today, a chosen day, outside days and disabled days passes axe', async () => {
    const el = await render(<Calendar today={TODAY} defaultValue="2026-09-15" isDateDisabled={weekend} />, mode);
    expect(await axeViolations(el)).toEqual([]);
  });

  it('days are 44 × 44 and the month always has six weeks', async () => {
    const el = await render(<Calendar today={TODAY} />, mode);
    const day = el.querySelector<HTMLElement>('.rds-calendar__day')!.getBoundingClientRect();
    expect([day.width, day.height]).toEqual([44, 44]);
    expect(el.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(el.querySelector<HTMLElement>('.rds-calendar')!.getBoundingClientRect().width).toBe(334);
  });
});

describe('Calendar behaviour', () => {
  it('the month title on the rojao light theme passes axe (text/heading is navy)', async () => {
    const el = await render(<Calendar today={TODAY} />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('a grid named by the month; today is aria-current, the chosen day aria-selected; one day in the tab order', async () => {
    const el = await render(<Calendar today={TODAY} defaultValue="2026-09-15" />);
    const grid = el.querySelector('[role="grid"]')!;
    expect(document.getElementById(grid.getAttribute('aria-labelledby')!)?.textContent).toBe('Setembro de 2026');
    expect(el.querySelector('[aria-current="date"]')?.getAttribute('aria-label')).toBe('30 de setembro de 2026');
    expect(el.querySelector('[aria-selected="true"] button')?.getAttribute('aria-label')).toBe('15 de setembro de 2026');
    expect(el.querySelectorAll('.rds-calendar__day[tabindex="0"]')).toHaveLength(1);
  });

  it('the arrows move a day and a week, PageUp/PageDown a month, Home/End the week; Enter chooses', async () => {
    const onValueChange = vi.fn();
    const el = await render(<Calendar today={TODAY} defaultValue="2026-09-15" onValueChange={onValueChange} />);
    el.querySelector<HTMLButtonElement>('.rds-calendar__day[tabindex="0"]')!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(focusedDay()).toBe('16 de setembro de 2026');
    await userEvent.keyboard('{ArrowDown}');
    expect(focusedDay()).toBe('23 de setembro de 2026');
    await userEvent.keyboard('{ArrowUp}{ArrowLeft}');
    expect(focusedDay()).toBe('15 de setembro de 2026');
    await userEvent.keyboard('{PageDown}');
    expect(focusedDay()).toBe('15 de outubro de 2026');
    expect(el.querySelector('.rds-calendar__title')?.textContent).toBe('Outubro de 2026');
    await userEvent.keyboard('{PageUp}{PageUp}');
    expect(focusedDay()).toBe('15 de agosto de 2026');
    await userEvent.keyboard('{Home}');
    expect(focusedDay()).toBe('9 de agosto de 2026');
    await userEvent.keyboard('{End}');
    expect(focusedDay()).toBe('15 de agosto de 2026');
    await userEvent.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('2026-08-15');
    expect(el.querySelector('[aria-selected="true"] button')?.getAttribute('aria-label')).toBe('15 de agosto de 2026');
  });

  it('a disabled day takes the focus but is not chosen', async () => {
    const onValueChange = vi.fn();
    const el = await render(<Calendar today={TODAY} defaultValue="2026-09-18" isDateDisabled={weekend} onValueChange={onValueChange} />);
    el.querySelector<HTMLButtonElement>('.rds-calendar__day[tabindex="0"]')!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(focusedDay()).toBe('19 de setembro de 2026');
    expect(document.activeElement?.getAttribute('aria-disabled')).toBe('true');
    await userEvent.keyboard('{Enter}');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('the header arrows change the month without moving the focus', async () => {
    const el = await render(<Calendar today={TODAY} />);
    const next = el.querySelector<HTMLButtonElement>('[aria-label="Próximo mês"]')!;
    next.focus();
    await userEvent.keyboard('{Enter}');
    expect(el.querySelector('.rds-calendar__title')?.textContent).toBe('Outubro de 2026');
    expect(document.activeElement).toBe(next);
    el.querySelector<HTMLButtonElement>('[aria-label="Mês anterior"]')!.click();
    await vi.waitFor(() => expect(el.querySelector('.rds-calendar__title')?.textContent).toBe('Setembro de 2026'));
  });
});
