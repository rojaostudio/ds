import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { DataTableHeader, type DataTableFilterDef } from './data-table-header';
import { FilterChip, FilterChipGroup } from './filter-chip';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

// Violations of the Figma itself, each pinned with it.fails in its own component's test: the neutral outline and
// ghost Buttons and the inactive FilterChip's count on the rojao light theme (button and filter-chip tests).
// Floating layers are portalled out of <main>: the landmark rule does not apply to them.
const KNOWN_LIGHT = (mode: string) => (mode === 'light' ? ['.rds-filter-chip__count'] : []);
const outsideRegion = (lines: string[]) => lines.filter((line) => !line.startsWith('region:'));

const STATUS = [
  { value: '', label: 'Todos' },
  { value: 'open', label: 'Abertos', count: 4 },
  { value: 'done', label: 'Concluídos', count: 12 },
];
const CHANNEL = [
  { value: '', label: 'Todos os canais' },
  { value: 'site', label: 'Site' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

function Example({
  two = false,
  mobileCollapse = false,
  withView = false,
  onSearch,
}: {
  two?: boolean;
  mobileCollapse?: boolean;
  withView?: boolean;
  onSearch?: (v: string) => void;
}) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [channel, setChannel] = useState('site');
  const [late, setLate] = useState(false);
  const filters: DataTableFilterDef[] = [{ key: 'status', label: 'Status', value: status, options: STATUS, onChange: setStatus }];
  if (two) filters.push({ key: 'channel', label: 'Canal', value: channel, options: CHANNEL, onChange: setChannel });
  return (
    <DataTableHeader
      search={{
        value: q,
        onChange: (v) => {
          setQ(v);
          onSearch?.(v);
        },
        placeholder: 'Buscar pedidos',
      }}
      quickFilters={
        <FilterChipGroup aria-label="Filtros rápidos">
          <FilterChip active={late} count={2} onClick={() => setLate((v) => !v)}>
            Atrasados
          </FilterChip>
        </FilterChipGroup>
      }
      view={withView ? <Checkbox>Agrupar por produto</Checkbox> : undefined}
      filters={filters}
      onClear={() => {
        setStatus('');
        setChannel('');
        setLate(false);
      }}
      actions={<Button>Novo pedido</Button>}
      mobileCollapse={mobileCollapse}
    />
  );
}

describe.each(MODES)('DataTableHeader (%s)', (mode) => {
  it('one filter and two (collapsed, one active) pass axe on a wide screen', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <div>
        <Example />
        <Example two withView />
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT(mode))).toEqual([]);
  });

  it('on a narrow screen, with the view control, passes axe', async () => {
    await page.viewport(390, 800);
    const el = await render(<Example two withView />, mode);
    expect(await axeViolations(el, KNOWN_LIGHT(mode))).toEqual([]);
  });

  it('the open Filtros popover passes axe', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Example two />, mode);
    await userEvent.click(el.querySelector<HTMLElement>('.rds-data-table-header__wide [data-filter-toggle]')!);
    await settle();
    expect(outsideRegion(await axeViolations(document.body, KNOWN_LIGHT(mode)))).toEqual([]);
  });
});

describe('DataTableHeader behaviour', () => {
  it('the search is an Input named by its placeholder, with a clear button', async () => {
    await page.viewport(1280, 800);
    const onSearch = vi.fn();
    const el = await render(<Example onSearch={onSearch} />);
    const search = el.querySelector<HTMLInputElement>('input[type="search"]')!;
    expect(search.getAttribute('aria-label')).toBe('Buscar pedidos');
    await userEvent.type(search, 'ana');
    expect(onSearch).toHaveBeenLastCalledWith('ana');
    await userEvent.click(el.querySelector<HTMLElement>('[aria-label="Limpar busca"]')!);
    expect(onSearch).toHaveBeenLastCalledWith('');
  });

  it('the quick filters slot holds what it is given (FilterChips here); one filter is a dropdown whose trigger fills when a value is chosen', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Example />);
    const chip = el.querySelector<HTMLButtonElement>('.rds-data-table-header__quick .rds-filter-chip')!;
    await userEvent.click(chip);
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    const trigger = el.querySelector<HTMLButtonElement>('.rds-data-table-header__wide .rds-button')!;
    expect(trigger.textContent).toBe('Status');
    await userEvent.click(trigger);
    await settle();
    await userEvent.click([...document.querySelectorAll<HTMLElement>('[role="menuitemradio"]')].find((i) => i.textContent?.startsWith('Abertos'))!);
    await vi.waitFor(() => expect(trigger.textContent).toBe('Abertos'));
    expect(trigger.className).toContain('rds-button--fill');
  });

  it('two filters collapse into Filtros (the count in the label, "Filtros · 1"); the active one stays as a Chip that removes it', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Example two />);
    const wide = el.querySelector<HTMLElement>('.rds-data-table-header__wide')!;
    const toggle = wide.querySelector<HTMLButtonElement>('[data-filter-toggle]')!;
    expect(toggle.textContent).toBe('Filtros · 1');
    expect(toggle.querySelector('.rds-badge')).toBeNull();
    expect(wide.querySelector('.rds-chip')!.textContent).toContain('Site');
    await userEvent.click(wide.querySelector<HTMLElement>('[aria-label="Remover filtro Canal"]')!);
    await vi.waitFor(() => expect(wide.querySelector('.rds-chip')).toBeNull());
    expect(toggle.textContent).toBe('Filtros');
  });

  it('picking in the Filtros popover sets the filter and closes it', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Example two />);
    await userEvent.click(el.querySelector<HTMLElement>('.rds-data-table-header__wide [data-filter-toggle]')!);
    await settle();
    const group = document.querySelector<HTMLElement>('[role="group"][aria-label="Status"]')!;
    await userEvent.click([...group.querySelectorAll<HTMLElement>('.rds-filter-chip')].find((c) => c.textContent?.startsWith('Concluídos'))!);
    await vi.waitFor(() => expect(document.querySelector('[role="group"][aria-label="Status"]')).toBeNull());
    expect(el.querySelector('.rds-data-table-header__wide [data-filter-toggle]')!.textContent).toBe('Filtros · 2');
  });

  it('on a narrow screen the wide parts hide; mobileCollapse puts the filters and the actions in a Drawer', async () => {
    await page.viewport(390, 800);
    const el = await render(<Example two mobileCollapse />);
    expect(getComputedStyle(el.querySelector('.rds-data-table-header__wide')!).display).toBe('none');
    await userEvent.click(el.querySelector<HTMLElement>('.rds-data-table-header__narrow [data-filter-toggle]')!);
    await settle();
    const drawer = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(drawer.querySelector('[role="group"][aria-label="Canal"]')).not.toBeNull();
    expect([...drawer.querySelectorAll('button')].some((b) => b.textContent === 'Novo pedido')).toBe(true);
  });

  it('at 796 wide, the Figma case (two quick filters, two filters on): "Filtros · 2" counts what it opens; the search keeps 320', async () => {
    await page.viewport(1280, 800);
    const noop = () => {};
    const el = await render(
      <div style={{ width: 796 }}>
        <DataTableHeader
          search={{ value: 'Maria', onChange: noop, placeholder: 'Buscar pedidos…' }}
          quickFilters={
            <FilterChipGroup aria-label="Filtros rápidos">
              <FilterChip active count={12} onClick={noop}>
                Abertos
              </FilterChip>
              <FilterChip count={3} onClick={noop}>
                Atrasados
              </FilterChip>
            </FilterChipGroup>
          }
          filters={[
            { key: 'status', label: 'Status', value: 'paid', options: [{ value: '', label: 'Todos' }, { value: 'paid', label: 'Pago' }], onChange: noop },
            { key: 'method', label: 'Forma', value: 'pix', options: [{ value: '', label: 'Todas' }, { value: 'pix', label: 'Pix' }], onChange: noop },
          ]}
          onClear={noop}
          actions={<Button>Novo pedido</Button>}
        />
      </div>,
    );
    // The quick filters show their own state in view: the count is the filters behind the button.
    expect(el.querySelector('.rds-data-table-header__wide [data-filter-toggle]')!.textContent).toBe('Filtros · 2');
    const search = el.querySelector<HTMLElement>('.rds-data-table-header__search')!;
    // flex-basis and min-width 320 with wrap: what does not fit beside it goes to the next line.
    expect(getComputedStyle(search).minWidth).toBe('min(320px, 100%)');
    expect(search.getBoundingClientRect().width).toBeGreaterThanOrEqual(320);
    expect(getComputedStyle(el.querySelector('.rds-data-table-header')!).justifyContent).toBe('flex-end');
  });

  it('the search never gets wider than a bar narrower than 320 (min-width: min(320, 100%))', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <div style={{ width: 280 }}>
        <DataTableHeader search={{ value: '', onChange: () => {}, placeholder: 'Buscar' }} />
      </div>,
    );
    const bar = el.querySelector<HTMLElement>('.rds-data-table-header')!;
    const search = el.querySelector<HTMLElement>('.rds-data-table-header__search')!;
    expect(search.getBoundingClientRect().width).toBeLessThanOrEqual(bar.getBoundingClientRect().width);
    expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
  });

  it('the view control comes after the filters and before the actions, on a wide and on a narrow screen', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(<Example two withView />);
      const bar = el.querySelector<HTMLElement>('.rds-data-table-header')!;
      const order = [...bar.children].map((c) => c.className);
      const view = order.findIndex((c) => c.includes('__view'));
      const lastFilters = Math.max(...order.map((c, i) => (c.includes('__wide') || c.includes('__narrow') ? i : -1)));
      expect(view).toBeGreaterThan(lastFilters);
      expect(view).toBeLessThan(order.findIndex((c) => c.includes('__actions')));
      const viewEl = bar.querySelector<HTMLElement>('.rds-data-table-header__view')!;
      expect(getComputedStyle(viewEl).display).not.toBe('none');
      expect(viewEl.textContent).toContain('Agrupar por produto');
      cleanup();
    }
  });
});
