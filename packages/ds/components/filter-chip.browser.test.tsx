import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { userEvent } from 'vitest/browser';
import { FilterChip, FilterChipGroup } from './filter-chip';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const Layers = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 2 2 7l10 5 10-5z" />
  </svg>
);

// The [RDS] draws the count at 60% of the label: on the inactive chip that is text/muted at 60% (3.3:1 on white
// in rojao light). Kept out of the light axe matrix and pinned below until the Figma decides.
const KNOWN_LIGHT_COUNT = (mode: string) => (mode === 'light' ? ['.rds-filter-chip__count'] : []);

describe.each(MODES)('FilterChip (%s)', (mode) => {
  it('inactive, active, with count and icon, link and disabled pass axe', async () => {
    const el = await render(
      <FilterChipGroup aria-label="Filtrar por tipo">
        <FilterChip active>Todos</FilterChip>
        <FilterChip count={12}>Entradas</FilterChip>
        <FilterChip icon={<Layers />} count={3} active>
          Saídas
        </FilterChip>
        <FilterChip asChild active>
          <a href="#ajustes">Ajustes</a>
        </FilterChip>
        <FilterChip disabled count={0}>
          Estornos
        </FilterChip>
        <FilterChip disabled active>
          Arquivados
        </FilterChip>
      </FilterChipGroup>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT_COUNT(mode))).toEqual([]);
  });

  it('is 32 tall, 44 to touch', async () => {
    const el = await render(<FilterChip>Todos</FilterChip>, mode);
    const chip = el.querySelector<HTMLElement>('.rds-filter-chip')!;
    expect(chip.getBoundingClientRect().height).toBe(32);
    expect(getComputedStyle(chip, '::before').top).toBe('-6px');
  });
});

describe('FilterChip behaviour', () => {
  it.fails('the count of an inactive chip on the rojao light theme passes axe (text/muted at 60%)', async () => {
    const el = await render(<FilterChip count={12}>Entradas</FilterChip>, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('a button with aria-pressed that turns on and off, by click and by keyboard', async () => {
    const onActiveChange = vi.fn();
    const el = await render(<FilterChip onActiveChange={onActiveChange}>Entradas</FilterChip>);
    const chip = el.querySelector('button')!;
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(chip);
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(onActiveChange).toHaveBeenLastCalledWith(true);
    chip.focus();
    await userEvent.keyboard('{Enter}');
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    await userEvent.keyboard(' ');
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(onActiveChange).toHaveBeenCalledTimes(3);
  });

  it('controlled: one filter on in a group (Todos, Entradas, Saídas)', async () => {
    function Filters() {
      const [on, setOn] = useState('todos');
      return (
        <FilterChipGroup aria-label="Filtrar por tipo">
          {['todos', 'entradas', 'saidas'].map((v) => (
            <FilterChip key={v} active={on === v} onClick={() => setOn(v)}>
              {v}
            </FilterChip>
          ))}
        </FilterChipGroup>
      );
    }
    const el = await render(<Filters />);
    expect(el.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Filtrar por tipo');
    const [todos, entradas] = Array.from(el.querySelectorAll('button'));
    await userEvent.click(entradas);
    expect(entradas.getAttribute('aria-pressed')).toBe('true');
    expect(todos.getAttribute('aria-pressed')).toBe('false');
  });

  it('the count is read after the label', async () => {
    const el = await render(<FilterChip count={12}>Entradas</FilterChip>);
    expect(el.querySelector('button')!.textContent).toBe('Entradas12');
  });

  it('asChild renders the link with aria-current when active, and no aria-pressed', async () => {
    const el = await render(
      <FilterChip asChild active count={4}>
        <a href="?filtro=entradas">Entradas</a>
      </FilterChip>,
    );
    const link = el.querySelector('a')!;
    expect(link.classList.contains('rds-filter-chip')).toBe(true);
    expect(link.getAttribute('aria-current')).toBe('true');
    expect(link.hasAttribute('aria-pressed')).toBe(false);
    expect(link.textContent).toBe('Entradas4');
  });

  it('disabled: focusable, does not turn on and a link does not navigate', async () => {
    const onActiveChange = vi.fn();
    const el = await render(
      <>
        <FilterChip disabled onActiveChange={onActiveChange}>
          Estornos
        </FilterChip>
        <FilterChip asChild disabled>
          <a href="#longe">Longe</a>
        </FilterChip>
      </>,
    );
    const chip = el.querySelector('button')!;
    chip.focus();
    expect(document.activeElement).toBe(chip);
    // Playwright refuses to click an aria-disabled element; the DOM click is what a pointer would send.
    chip.click();
    await userEvent.keyboard('{Enter}');
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    expect(onActiveChange).not.toHaveBeenCalled();
    const link = el.querySelector('a')!;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
