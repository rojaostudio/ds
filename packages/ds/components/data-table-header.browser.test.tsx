import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Badge } from './badge';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { DataTableHeader, type DataTableFilterDef } from './data-table-header';
import { FilterChip, FilterChipGroup } from './filter-chip';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

// Floating layers are portalled out of <main>: the landmark rule does not apply to them.
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
          <FilterChip pressed={late} count={2} onClick={() => setLate((v) => !v)}>
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
    expect(await axeViolations(el)).toEqual([]);
  });

  it('on a narrow screen, with the view control, passes axe', async () => {
    await page.viewport(390, 800);
    const el = await render(<Example two withView />, mode);
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the open Filtros popover passes axe', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Example two />, mode);
    await userEvent.click(el.querySelector<HTMLElement>('.rds-data-table-header__wide [data-filter-toggle]')!);
    await settle();
    expect(outsideRegion(await axeViolations(document.body))).toEqual([]);
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

  it('compact, the wide parts hide; mobileCollapse puts the filters and the actions in a Drawer', async () => {
    await page.viewport(390, 800);
    const el = await render(<Example two mobileCollapse />);
    expect(getComputedStyle(el.querySelector('.rds-data-table-header__wide')!).display).toBe('none');
    await userEvent.click(el.querySelector<HTMLElement>('.rds-data-table-header__narrow [data-filter-toggle]')!);
    await settle();
    const drawer = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(drawer.querySelector('[role="group"][aria-label="Canal"]')).not.toBeNull();
    expect([...drawer.querySelectorAll('button')].some((b) => b.textContent === 'Novo pedido')).toBe(true);
  });

  it('expanded (a bar of 1100), the Figma case (two quick filters, two filters on): "Filtros · 2" counts what it opens; the search keeps 320', async () => {
    await page.viewport(1280, 800);
    const noop = () => {};
    const el = await render(
      <div style={{ width: 1100 }}>
        <DataTableHeader
          search={{ value: 'Maria', onChange: noop, placeholder: 'Buscar pedidos…' }}
          quickFilters={
            <FilterChipGroup aria-label="Filtros rápidos">
              <FilterChip pressed count={12} onClick={noop}>
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

const CATEGORIES = [
  { value: '', label: 'Todas' },
  { value: 'paid', label: 'Pago' },
  { value: 'pending', label: 'Pendente' },
];

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Figma "exemplo · Produtos · 390": the search, the Categoria filter and an outline IconButton as the action. */
function Produtos({ category = '', multiple = false, active = 0 }: { category?: string; multiple?: boolean; active?: number }) {
  const [value, setValue] = useState(category);
  const noop = () => {};
  const filters: DataTableFilterDef[] = multiple
    ? [
        { key: 'status', label: 'Status', value: active > 0 ? 'paid' : '', options: CATEGORIES, onChange: noop },
        { key: 'method', label: 'Forma', value: active > 1 ? 'pix' : '', options: [{ value: '', label: 'Todas' }, { value: 'pix', label: 'Pix' }], onChange: noop },
        { key: 'channel', label: 'Canal', value: active > 2 ? 'site' : '', options: CHANNEL, onChange: noop },
      ]
    : [{ key: 'category', label: 'Categoria', value, options: CATEGORIES, onChange: setValue }];
  return (
    <DataTableHeader
      search={{ value: '', onChange: noop, placeholder: 'Buscar produtos…' }}
      filters={filters}
      onClear={noop}
      actions={
        <Tooltip text="Organizar categorias">
          <IconButton icon={<GearIcon />} label="Organizar categorias" variant="outline" tone="neutral" />
        </Tooltip>
      }
    />
  );
}

const visible = (node: Element) => getComputedStyle(node).display !== 'none';
const compactToggle = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('.rds-data-table-header__narrow [data-filter-toggle]')!;

describe.each(MODES)('DataTableHeader compact (%s)', (mode) => {
  it('at 390, with the dot (one filter on) and the counter (several), passes axe', async () => {
    await page.viewport(390, 800);
    const el = await render(
      <div>
        <Produtos category="paid" />
        <Produtos multiple active={3} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the compact Filtros popover passes axe', async () => {
    await page.viewport(390, 800);
    const el = await render(<Produtos multiple active={2} />, mode);
    await userEvent.click(compactToggle(el));
    await settle();
    expect(outsideRegion(await axeViolations(document.body))).toEqual([]);
  });
});

describe('DataTableHeader compact (bar below 1024)', () => {
  it('at 390: the search, the filter IconButton and the action IconButton on one line, 44 tall; the search accepts 200', async () => {
    await page.viewport(390, 800);
    const el = await render(<Produtos />);
    const bar = el.querySelector<HTMLElement>('.rds-data-table-header')!;
    const search = bar.querySelector<HTMLElement>('.rds-data-table-header__search')!;
    const toggle = compactToggle(el);
    const action = bar.querySelector<HTMLElement>('[aria-label="Organizar categorias"]')!;
    expect(getComputedStyle(search).minWidth).toBe('min(200px, 100%)');
    expect(search.getBoundingClientRect().width).toBeGreaterThanOrEqual(200);
    const tops = [search, toggle, action].map((n) => n.getBoundingClientRect().top);
    expect(new Set(tops).size).toBe(1);
    expect(bar.getBoundingClientRect().height).toBe(44);
    // The IconButton is outline, neutral, 44 × 44 (the target); the labelled Button and the Separator are hidden.
    expect(toggle.className).toContain('rds-button--outline');
    const box = toggle.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([44, 44]);
    expect(visible(bar.querySelector('.rds-data-table-header__wide')!)).toBe(false);
    expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
  });

  it('the arrangement follows the screen, as the Figma viewport mode: a bar of 976 (sidebar beside it) on a 1280 screen stays expanded', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <div style={{ width: 976 }}>
        <Produtos />
      </div>,
    );
    expect(visible(el.querySelector('.rds-data-table-header__wide')!)).toBe(true);
    expect(visible(el.querySelector('.rds-data-table-header__narrow')!)).toBe(false);
  });

  it('one filter: no dot while "Todas"; on, a dot (aria-hidden, the Badge neutral colour) and the name with the state', async () => {
    await page.viewport(390, 800);
    const el = await render(
      <div>
        <Produtos />
        <Badge tone="neutral" value={1} data-ref="" />
      </div>,
    );
    const toggle = compactToggle(el);
    expect(toggle.getAttribute('aria-label')).toBe('Categoria');
    expect(el.querySelector('.rds-data-table-header__dot')).toBeNull();
    await userEvent.click(toggle);
    await settle();
    // The same options as before: a Drawer (never a popover on a phone) with the Categoria group.
    const drawer = document.querySelector<HTMLElement>('[role="dialog"]')!;
    await userEvent.click(
      [...drawer.querySelectorAll<HTMLElement>('[role="group"][aria-label="Categoria"] .rds-filter-chip')].find((c) => c.textContent?.startsWith('Pago'))!,
    );
    await vi.waitFor(() => expect(compactToggle(el).getAttribute('aria-label')).toBe('Categoria, Pago'));
    const dot = el.querySelector<HTMLElement>('.rds-data-table-header__dot')!;
    expect(dot.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(dot).backgroundColor).toBe(getComputedStyle(el.querySelector('[data-ref]')!).backgroundColor);
    const d = dot.getBoundingClientRect();
    const t = compactToggle(el).getBoundingClientRect();
    expect([d.width, d.height, t.right - d.right, d.top - t.top]).toEqual([8, 8, 6, 6]);
    expect(el.querySelector('.rds-data-table-header__narrow .rds-badge')).toBeNull();
  });

  it('several filters: the counter is a neutral number Badge, aria-hidden; the name says how many ("Filtros, 3 ativos")', async () => {
    await page.viewport(390, 800);
    for (const [active, name] of [
      [0, 'Filtros'],
      [1, 'Filtros, 1 ativo'],
      [3, 'Filtros, 3 ativos'],
    ] as const) {
      const el = await render(<Produtos multiple active={active} />);
      const toggle = compactToggle(el);
      expect(toggle.getAttribute('aria-label')).toBe(name);
      const badge = el.querySelector<HTMLElement>('.rds-data-table-header__narrow .rds-badge');
      if (active === 0) {
        expect(badge).toBeNull();
      } else {
        expect(badge!.textContent).toBe(String(active));
        expect(badge!.className).toContain('rds-badge--neutral-fill');
        expect(badge!.getAttribute('aria-hidden')).toBe('true');
      }
      expect(el.querySelector('.rds-data-table-header__dot')).toBeNull();
      cleanup();
    }
  });

  it('the IconButton has its Tooltip with the label', async () => {
    await page.viewport(390, 800);
    const el = await render(<Produtos multiple active={2} />);
    compactToggle(el).focus();
    await vi.waitFor(() => expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('Filtros'));
  });

  it('several filters: the IconButton opens the same Filtros popover as the labelled Button, and picking closes it', async () => {
    await page.viewport(390, 800);
    const el = await render(<Example two />);
    const toggle = compactToggle(el);
    expect(toggle.getAttribute('aria-label')).toBe('Filtros, 1 ativo');
    await userEvent.click(toggle);
    await settle();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const group = document.querySelector<HTMLElement>('[role="group"][aria-label="Status"]')!;
    expect(document.querySelector('[role="group"][aria-label="Canal"]')).not.toBeNull();
    await userEvent.click([...group.querySelectorAll<HTMLElement>('.rds-filter-chip')].find((c) => c.textContent?.startsWith('Concluídos'))!);
    await vi.waitFor(() => expect(document.querySelector('[role="group"][aria-label="Status"]')).toBeNull());
    expect(compactToggle(el).getAttribute('aria-label')).toBe('Filtros, 2 ativos');
  });

  it('at 1280 (expanded) the filter is the Button with its label, after the Separator; no IconButton in view', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <div>
        <Produtos category="paid" />
        <Produtos multiple active={3} />
      </div>,
    );
    const [one, several] = [...el.querySelectorAll<HTMLElement>('.rds-data-table-header')];
    for (const bar of [one, several]) {
      expect(visible(bar.querySelector('.rds-data-table-header__narrow')!)).toBe(false);
      expect(bar.querySelector('.rds-data-table-header__wide [role="separator"], .rds-data-table-header__wide .rds-separator')).not.toBeNull();
    }
    expect(one.querySelector('.rds-data-table-header__wide .rds-button')!.textContent).toBe('Pago');
    expect(several.querySelector('.rds-data-table-header__wide [data-filter-toggle]')!.textContent).toBe('Filtros · 3');
  });
});
