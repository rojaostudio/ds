import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { useState } from 'react';
import { DataTableHeader } from './data-table-header';
import { FilterChip, FilterChipGroup } from './filter-chip';
import { FilterChipMenu, type FilterChipMenuOption } from './filter-chip-menu';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

// The menu is portalled to the body, outside the test's <main>: the landmark rule (region) does not apply to it.
const outsideRegion = (lines: string[]) => lines.filter((line) => !line.startsWith('region:'));
const menu = () => document.querySelector<HTMLElement>('[role="menu"]');
const items = () => [...menu()!.querySelectorAll<HTMLElement>('[role^="menuitem"]')];
const pill = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('.rds-filter-chip-menu')!;

const OPTIONS: FilterChipMenuOption[] = [
  { value: 'laser', label: 'Laser', count: 3 },
  { value: 'plotter', label: 'Plotter', count: 4 },
  { value: 'offset', label: 'Offset', count: 1 },
  { value: 'dtf', label: 'DTF', count: 0, disabled: true },
];

async function open(el: HTMLElement) {
  await userEvent.click(pill(el));
  await vi.waitFor(() => expect(menu()).not.toBeNull());
  await settle();
}

describe.each(MODES)('FilterChipMenu (%s)', (mode) => {
  it('closed (all, one, several, disabled) passes axe', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 8 }}>
        <FilterChipMenu label="Processo" options={OPTIONS} />
        <FilterChipMenu label="Processo" options={OPTIONS} defaultValue={['laser']} />
        <FilterChipMenu label="Processo" options={OPTIONS} defaultValue={['laser', 'plotter']} />
        <FilterChipMenu label="Processo" options={OPTIONS} disabled />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('open (ticked, counts, a disabled option, Limpar) passes axe', async () => {
    const el = await render(<FilterChipMenu label="Processo" options={OPTIONS} defaultValue={['laser']} />, mode);
    await open(el);
    expect(outsideRegion(await axeViolations(document.body))).toEqual([]);
  });
});

describe('FilterChipMenu behaviour', () => {
  it('is the FilterChip pill: 32 tall, 44 to touch, same radius and type', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <FilterChip>Atrasados</FilterChip>
        <FilterChipMenu label="Processo" options={OPTIONS} />
      </div>,
    );
    const chip = getComputedStyle(el.querySelector('.rds-filter-chip:not(.rds-filter-chip-menu)')!);
    const p = pill(el);
    const own = getComputedStyle(p);
    expect(p.getBoundingClientRect().height).toBe(32);
    expect(getComputedStyle(p, '::before').top).toBe('-6px');
    for (const k of ['borderRadius', 'fontSize', 'fontWeight', 'paddingLeft'] as const) expect(own[k]).toBe(chip[k]);
  });

  it('reads "Processo: Todos", then the option, then the number; with several the name spells them', async () => {
    function Controlled() {
      const [value, setValue] = useState<string[]>([]);
      return <FilterChipMenu label="Processo" options={OPTIONS} value={value} onValueChange={setValue} />;
    }
    const el = await render(<Controlled />);
    expect(pill(el).textContent).toBe('Processo: Todos');
    expect(pill(el).hasAttribute('aria-label')).toBe(false);
    await open(el);
    await userEvent.click(items()[0]);
    await vi.waitFor(() => expect(pill(el).textContent).toBe('Processo: Laser'));
    await userEvent.click(items()[1]);
    await vi.waitFor(() => expect(pill(el).textContent).toBe('Processo · 2'));
    expect(pill(el).getAttribute('aria-label')).toBe('Processo · 2: Laser, Plotter');
  });

  it('opens a menu: aria-haspopup, aria-expanded, never aria-pressed; on only while something is ticked', async () => {
    const el = await render(<FilterChipMenu label="Processo" options={OPTIONS} />);
    const p = pill(el);
    expect(p.getAttribute('aria-haspopup')).toBe('menu');
    expect(p.getAttribute('aria-expanded')).toBe('false');
    expect(p.hasAttribute('aria-pressed')).toBe(false);
    expect(p.classList).not.toContain('rds-filter-chip--pressed');
    await open(el);
    expect(p.getAttribute('aria-expanded')).toBe('true');
    expect(p.getAttribute('data-state')).toBe('open');
    expect(getComputedStyle(p.querySelector('.rds-filter-chip-menu__chevron')!).transform).not.toBe('none');
    await userEvent.click(items()[0]);
    await vi.waitFor(() => expect(p.classList).toContain('rds-filter-chip--pressed'));
    expect(p.hasAttribute('aria-pressed')).toBe(false);
  });

  it('the on colours are the FilterChip pressed ones', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 8 }}>
        <FilterChip pressed>Atrasados</FilterChip>
        <FilterChipMenu label="Processo" options={OPTIONS} defaultValue={['laser']} />
      </div>,
    );
    const chip = getComputedStyle(el.querySelector('.rds-filter-chip:not(.rds-filter-chip-menu)')!);
    const own = getComputedStyle(pill(el));
    for (const k of ['backgroundColor', 'borderColor', 'color'] as const) expect(own[k]).toBe(chip[k]);
  });

  it('the options are menuitemcheckbox with the count; ticking keeps it open and emits in the order of the options', async () => {
    const onValueChange = vi.fn();
    const el = await render(<FilterChipMenu label="Processo" options={OPTIONS} onValueChange={onValueChange} />);
    await open(el);
    const [laser, plotter] = items();
    expect(laser.getAttribute('role')).toBe('menuitemcheckbox');
    expect(laser.getAttribute('aria-checked')).toBe('false');
    expect(laser.querySelector('.rds-menu__count')!.textContent).toBe('3');
    await userEvent.click(plotter);
    expect(onValueChange).toHaveBeenLastCalledWith(['plotter']);
    expect(menu()).not.toBeNull();
    await userEvent.click(items()[0]);
    expect(onValueChange).toHaveBeenLastCalledWith(['laser', 'plotter']);
    expect(items()[0].getAttribute('aria-checked')).toBe('true');
    expect(items()[0].querySelector('.rds-checkbox__box')!.hasAttribute('data-checked')).toBe(true);
  });

  it('keyboard: Enter opens on the first option, Space ticks without closing, the arrows skip the disabled one, a letter jumps', async () => {
    const el = await render(<FilterChipMenu label="Processo" options={OPTIONS} />);
    pill(el).focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(document.activeElement?.textContent).toContain('Laser'));
    await userEvent.keyboard(' ');
    await vi.waitFor(() => expect(items()[0].getAttribute('aria-checked')).toBe('true'));
    expect(menu()).not.toBeNull();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(document.activeElement?.textContent).not.toContain('DTF');
    await userEvent.keyboard('p');
    await vi.waitFor(() => expect(document.activeElement?.textContent).toContain('Plotter'));
  });

  it('Escape closes and gives the focus back to the pill, now named with the value', async () => {
    const el = await render(<FilterChipMenu label="Processo" options={OPTIONS} />);
    await open(el);
    await userEvent.click(items()[0]);
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(menu()).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(pill(el)));
    expect(pill(el).textContent).toBe('Processo: Laser');
  });

  it('Limpar unticks everything, closes and gives the focus back; with nothing ticked it is disabled', async () => {
    const onValueChange = vi.fn();
    const el = await render(<FilterChipMenu label="Processo" options={OPTIONS} defaultValue={['laser', 'plotter']} onValueChange={onValueChange} />);
    await open(el);
    const clear = items().at(-1)!;
    expect(clear.textContent).toBe('Limpar');
    await userEvent.click(clear);
    expect(onValueChange).toHaveBeenLastCalledWith([]);
    await vi.waitFor(() => expect(menu()).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(pill(el)));
    expect(pill(el).textContent).toBe('Processo: Todos');
    expect(pill(el).classList).not.toContain('rds-filter-chip--pressed');
    await open(el);
    expect(items().at(-1)!.getAttribute('aria-disabled')).toBe('true');
  });

  it('controlled: when the parent ignores the change, nothing changes', async () => {
    const el = await render(<FilterChipMenu label="Processo" options={OPTIONS} value={[]} onValueChange={() => {}} />);
    await open(el);
    await userEvent.click(items()[0]);
    await settle();
    expect(items()[0].getAttribute('aria-checked')).toBe('false');
    expect(pill(el).textContent).toBe('Processo: Todos');
  });

  it('an unknown value is kept but not shown: the pill reads Todos and is off', async () => {
    const onValueChange = vi.fn();
    const el = await render(<FilterChipMenu label="Processo" options={OPTIONS} defaultValue={['fantasma']} onValueChange={onValueChange} />);
    expect(pill(el).textContent).toBe('Processo: Todos');
    expect(pill(el).classList).not.toContain('rds-filter-chip--pressed');
    await open(el);
    await userEvent.click(items()[0]);
    expect(onValueChange).toHaveBeenLastCalledWith(['laser', 'fantasma']);
  });

  it('disabled: focusable, aria-disabled, opens neither by click nor by Enter', async () => {
    const el = await render(<FilterChipMenu label="Processo" options={OPTIONS} disabled />);
    const p = pill(el);
    expect(p.getAttribute('aria-disabled')).toBe('true');
    // Playwright refuses to click an aria-disabled element: the pointer is dispatched by hand.
    p.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, pointerType: 'mouse' }));
    p.click();
    await settle();
    expect(menu()).toBeNull();
    p.focus();
    expect(document.activeElement).toBe(p);
    await userEvent.keyboard('{Enter}');
    await settle();
    expect(menu()).toBeNull();
  });

  it('a long label ellipsises and the pill stays inside its box', async () => {
    const el = await render(
      <div style={{ width: 160 }}>
        <FilterChipMenu label="Responsável pela produção" options={[{ value: 'a', label: 'Ana Beatriz Cavalcanti' }]} defaultValue={['a']} />
      </div>,
    );
    const label = pill(el).querySelector<HTMLElement>('.rds-filter-chip__label')!;
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(pill(el).getBoundingClientRect().width).toBeLessThanOrEqual(160);
  });

  it.each([
    [1280, 800],
    [390, 800],
  ])('in the DataTableHeader quickFilters at %i: in view, 32 tall, the menu opens on a tap inside the screen', async (w, h) => {
    await page.viewport(w, h);
    try {
      const el = await render(
        <DataTableHeader
          search={{ value: '', onChange: () => {}, placeholder: 'Buscar' }}
          quickFilters={
            <>
              <FilterChipGroup aria-label="Situação">
                <FilterChip>Atrasados</FilterChip>
              </FilterChipGroup>
              <FilterChipMenu label="Processo" options={OPTIONS} />
            </>
          }
        />,
      );
      const p = pill(el);
      expect(p.offsetParent).not.toBeNull();
      expect(p.getBoundingClientRect().height).toBe(32);
      await open(el);
      const r = menu()!.getBoundingClientRect();
      expect(r.left).toBeGreaterThanOrEqual(0);
      expect(r.right).toBeLessThanOrEqual(w);
    } finally {
      await page.viewport(1280, 800);
    }
  });
});
