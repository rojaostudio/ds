import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
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

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** The list's action, as the Figma asks: an outline neutral IconButton with its Tooltip (creating is the FAB). */
const ACTION = (
  <Tooltip text="Organizar pedidos">
    <IconButton icon={<GearIcon />} label="Organizar pedidos" variant="outline" tone="neutral" size="sm" />
  </Tooltip>
);

function Example({
  two = false,
  mobileCollapse = false,
  withView = false,
  moreQuick = false,
  count,
  channel: initialChannel = 'site',
  searchLabel = 'Buscar pedidos',
  onSearch,
}: {
  /** One search landmark per bar: several bars on one page need different names. */
  searchLabel?: string;
  two?: boolean;
  mobileCollapse?: boolean;
  withView?: boolean;
  /** Three quick filters instead of one, so the tools wrap on a tablet too. */
  moreQuick?: boolean;
  count?: ReactNode;
  channel?: string;
  onSearch?: (v: string) => void;
}) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [channel, setChannel] = useState(initialChannel);
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
        placeholder: 'Buscar pedidos…',
        label: searchLabel,
      }}
      quickFilters={
        <FilterChipGroup aria-label="Situação">
          <FilterChip pressed={late} count={2} onClick={() => setLate((v) => !v)}>
            Atrasados
          </FilterChip>
          {moreQuick && (
            <>
              <FilterChip count={9} onClick={() => {}}>
                Em separação
              </FilterChip>
              <FilterChip count={31} onClick={() => {}}>
                Entregues hoje
              </FilterChip>
            </>
          )}
        </FilterChipGroup>
      }
      view={withView ? <Checkbox>Agrupar por produto</Checkbox> : undefined}
      count={count}
      filters={filters}
      onClear={() => {
        setStatus('');
        setChannel('');
        setLate(false);
      }}
      actions={ACTION}
      mobileCollapse={mobileCollapse}
    />
  );
}

const CATEGORIES = [
  { value: '', label: 'Todas' },
  { value: 'paid', label: 'Pago' },
  { value: 'pending', label: 'Pendente' },
];

/** Figma "exemplo · Produtos": the search, the Categoria filter (or several) and an outline IconButton as the action. */
function Produtos({
  category = '',
  multiple = false,
  active = 0,
  searchLabel = 'Buscar produtos',
}: {
  category?: string;
  multiple?: boolean;
  active?: number;
  searchLabel?: string;
}) {
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
      search={{ value: '', onChange: noop, placeholder: 'Buscar produtos…', label: searchLabel }}
      filters={filters}
      onClear={noop}
      actions={
        <Tooltip text="Organizar categorias">
          <IconButton icon={<GearIcon />} label="Organizar categorias" variant="outline" tone="neutral" size="sm" />
        </Tooltip>
      }
    />
  );
}

const visible = (node: Element) => getComputedStyle(node).display !== 'none';
const wideToggle = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('.rds-data-table-header__wide [data-filter-toggle]')!;
const compactToggle = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('.rds-data-table-header__narrow [data-filter-toggle]')!;
const searchMin = (el: Element) => getComputedStyle(el.querySelector('.rds-data-table-header')!).getPropertyValue('--data-table-header-search-min').trim();

describe.each(MODES)('DataTableHeader (%s)', (mode) => {
  it('empty, one active, several active, with the count: passes axe on a wide screen', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <div>
        <Example channel="" />
        <Example two count="128 resultados" searchLabel="Buscar clientes" />
        <Produtos multiple active={3} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('compact (390), inactive and active, with the view control: passes axe', async () => {
    await page.viewport(390, 800);
    const el = await render(
      <div>
        <Example two withView />
        <Produtos />
        <Produtos category="paid" searchLabel="Buscar categorias" />
        <Produtos multiple active={3} searchLabel="Buscar pagamentos" />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the open Filtros popover passes axe (expanded and compact)', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(<Produtos multiple active={2} />, mode);
      await userEvent.click(width === 1280 ? wideToggle(el) : compactToggle(el));
      await settle();
      expect(outsideRegion(await axeViolations(document.body))).toEqual([]);
      cleanup();
    }
  });
});

describe('DataTableHeader in the brand (.ds-plate)', () => {
  it('empty, one active, several active and compact pass axe', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(
        <div className="ds-plate" style={{ background: 'var(--surface-page)', padding: 16 }}>
          <Example channel="" count="12 resultados" />
          <Produtos category="paid" />
          <Produtos multiple active={3} searchLabel="Buscar pagamentos" />
        </div>,
      );
      expect(await axeViolations(el)).toEqual([]);
      cleanup();
    }
  });
});

describe('DataTableHeader behaviour', () => {
  it('the search: role="search", named by its label apart from the placeholder, with a clear button', async () => {
    await page.viewport(1280, 800);
    const onSearch = vi.fn();
    const el = await render(<Example onSearch={onSearch} />);
    const region = el.querySelector<HTMLElement>('[role="search"]')!;
    expect(region.className).toContain('rds-data-table-header__search');
    const search = region.querySelector<HTMLInputElement>('input[type="search"]')!;
    expect(search.getAttribute('aria-label')).toBe('Buscar pedidos');
    expect(search.placeholder).toBe('Buscar pedidos…');
    await userEvent.type(search, 'ana');
    expect(onSearch).toHaveBeenLastCalledWith('ana');
    await userEvent.click(el.querySelector<HTMLElement>('[aria-label="Limpar busca"]')!);
    expect(onSearch).toHaveBeenLastCalledWith('');
  });

  it('the search defaults: named "Buscar", placeholder "Buscar…"', async () => {
    await page.viewport(1280, 800);
    const el = await render(<DataTableHeader search={{ value: '', onChange: () => {} }} />);
    const search = el.querySelector<HTMLInputElement>('input[type="search"]')!;
    expect(search.getAttribute('aria-label')).toBe('Buscar');
    expect(search.placeholder).toBe('Buscar…');
  });

  it('the quick filters are a group "Filtros rápidos"; their chips carry aria-pressed', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Example />);
    const quick = el.querySelector<HTMLElement>('.rds-data-table-header__quick')!;
    expect(quick.getAttribute('role')).toBe('group');
    expect(quick.getAttribute('aria-label')).toBe('Filtros rápidos');
    const chip = quick.querySelector<HTMLButtonElement>('.rds-filter-chip')!;
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(chip);
    expect(chip.getAttribute('aria-pressed')).toBe('true');
  });

  it('the quick filters stay on one line and scroll sideways, also on a phone', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(<Example />);
      const quick = getComputedStyle(el.querySelector<HTMLElement>('.rds-data-table-header__quick')!);
      expect(quick.flexWrap).toBe('nowrap');
      expect(quick.overflowX).toBe('auto');
    }
  });

  it('no Separator and no Badge anywhere in the bar', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(
        <div>
          <Example two />
          <Produtos category="paid" />
          <Produtos multiple active={3} />
        </div>,
      );
      expect(el.querySelector('.rds-separator, [role="separator"]')).toBeNull();
      expect(el.querySelector('.rds-badge')).toBeNull();
      cleanup();
    }
  });

  it('one filter, expanded: a Button with the sliders before its label and a menu; fill once a value is chosen, named with it', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Example />);
    const trigger = wideToggle(el);
    expect(trigger.textContent).toBe('Status');
    expect(trigger.className).toContain('rds-button--outline');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    // The sliders come before the label.
    const icon = trigger.querySelector('svg')!.getBoundingClientRect();
    expect(icon.right).toBeLessThan(trigger.getBoundingClientRect().left + trigger.getBoundingClientRect().width / 2);
    await userEvent.click(trigger);
    await settle();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    await userEvent.click([...document.querySelectorAll<HTMLElement>('[role="menuitemradio"]')].find((i) => i.textContent?.startsWith('Abertos'))!);
    await vi.waitFor(() => expect(trigger.className).toContain('rds-button--fill'));
    expect(trigger.textContent).toBe('Status');
    expect(trigger.getAttribute('aria-label')).toBe('Status, Abertos');
  });

  it('two filters collapse into "Filtros · N" (count in the label, no Badge); it announces aria-expanded/aria-haspopup', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Example two />);
    const toggle = wideToggle(el);
    expect(toggle.textContent).toBe('Filtros · 1');
    expect(toggle.className).toContain('rds-button--fill');
    expect(toggle.getAttribute('aria-haspopup')).toBe('dialog');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(toggle);
    await settle();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const group = document.querySelector<HTMLElement>('[role="group"][aria-label="Status"]')!;
    await userEvent.click([...group.querySelectorAll<HTMLElement>('.rds-filter-chip')].find((c) => c.textContent?.startsWith('Concluídos'))!);
    await vi.waitFor(() => expect(document.querySelector('[role="group"][aria-label="Status"]')).toBeNull());
    expect(wideToggle(el).textContent).toBe('Filtros · 2');
  });

  it('the active filters get their own line after the row: Chips and "Limpar filtros" (ghost sm); a Chip removes its filter', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Example two />);
    const bar = el.querySelector<HTMLElement>('.rds-data-table-header')!;
    expect([...bar.children].map((c) => c.className)).toEqual(['rds-data-table-header__row', 'rds-data-table-header__active']);
    expect(getComputedStyle(bar).flexDirection).toBe('column');
    const active = bar.querySelector<HTMLElement>('.rds-data-table-header__active')!;
    const chips = active.querySelector<HTMLElement>('.rds-data-table-header__chips')!;
    expect(getComputedStyle(chips).flexWrap).toBe('wrap');
    expect(getComputedStyle(chips).flexBasis).toBe('280px');
    expect(chips.querySelector('.rds-chip')!.textContent).toContain('Canal: Site');
    const clear = [...active.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Limpar filtros')!;
    expect(clear.className).toContain('rds-button--ghost');
    expect(clear.className).toContain('rds-button--sm');
    // Chips come before "Limpar filtros", in the DOM (the Tab order) and on screen.
    expect(chips.compareDocumentPosition(clear) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await userEvent.click(el.querySelector<HTMLElement>('[aria-label="Remover filtro Canal: Site"]')!);
    await vi.waitFor(() => expect(el.querySelector('.rds-data-table-header__active')).toBeNull());
    expect(wideToggle(el).textContent).toBe('Filtros');
  });

  it('one filter on: the same line with its Chip and "Limpar filtros" (no IconButton X); no line while nothing is on', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Produtos category="paid" />);
    const active = el.querySelector<HTMLElement>('.rds-data-table-header__active')!;
    expect(active.querySelector('.rds-chip')!.textContent).toContain('Categoria: Pago');
    expect([...active.querySelectorAll('button')].some((b) => b.textContent === 'Limpar filtros')).toBe(true);
    expect(el.querySelector('.rds-data-table-header__row [aria-label="Limpar filtros"]')).toBeNull();
    cleanup();
    const empty = await render(<Produtos />);
    expect(empty.querySelector('.rds-data-table-header__active')).toBeNull();
  });

  it('"Limpar filtros" clears and gives the focus back to the search', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Example two />);
    const clear = [...el.querySelectorAll<HTMLButtonElement>('.rds-data-table-header__active button')].find((b) => b.textContent === 'Limpar filtros')!;
    await userEvent.click(clear);
    await vi.waitFor(() => expect(el.querySelector('.rds-data-table-header__active')).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(el.querySelector('input[type="search"]')));
  });

  it('Escape closes the Filtros popover and gives the focus back to its trigger', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Example two />);
    const toggle = wideToggle(el);
    await userEvent.click(toggle);
    await settle();
    expect(document.querySelector('[role="group"][aria-label="Status"]')).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.querySelector('[role="group"][aria-label="Status"]')).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(toggle));
  });

  it('Escape closes the compact Drawer of one filter and gives the focus back to its trigger', async () => {
    await page.viewport(390, 800);
    const el = await render(<Produtos />);
    const toggle = compactToggle(el);
    expect(toggle.getAttribute('aria-haspopup')).toBe('dialog');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(toggle);
    await settle();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(compactToggle(el)));
  });

  it('the Tab order is the visual order: search → quick filters → trigger → view → action → Chips → Limpar filtros', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Example two withView />);
    const search = el.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.focus();
    const names: string[] = [];
    for (let i = 0; i < 7; i++) {
      await userEvent.tab();
      const a = document.activeElement as HTMLElement;
      const labelled = a instanceof HTMLInputElement ? a.labels?.[0]?.textContent : undefined;
      names.push(a.getAttribute('aria-label') ?? labelled ?? a.textContent ?? '');
    }
    // The Input's own clear button only shows with a value: from the search, Tab goes to the quick filter.
    expect(names).toEqual([
      expect.stringContaining('Atrasados'),
      'Filtros · 1',
      expect.stringContaining('Agrupar por produto'),
      'Organizar pedidos',
      'Remover filtro Canal: Site',
      'Limpar filtros',
      expect.anything(),
    ]);
  });

  it('the count sits at the end of the tools, a polite live region', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Example two withView count="128 resultados" />);
    const tools = el.querySelector<HTMLElement>('.rds-data-table-header__tools')!;
    const last = tools.lastElementChild as HTMLElement;
    expect(last.className).toBe('rds-data-table-header__count');
    expect(last.tagName).toBe('SPAN');
    expect(last.getAttribute('aria-live')).toBe('polite');
    expect(last.textContent).toBe('128 resultados');
  });

  it('expanded: the tools are packed to the start; the search takes 320 (the --data-table-header-search-min token)', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <div style={{ width: 1100 }}>
        <Example two />
      </div>,
    );
    expect(searchMin(el)).toBe('320px');
    const tools = el.querySelector<HTMLElement>('.rds-data-table-header__tools')!;
    expect(getComputedStyle(tools).justifyContent).toBe('flex-start');
    const search = el.querySelector<HTMLElement>('.rds-data-table-header__search')!;
    expect(getComputedStyle(search).minWidth).toBe('min(320px, 100%)');
    expect(search.getBoundingClientRect().width).toBeGreaterThanOrEqual(320);
    // Packed to the start: the search begins where the tools begin.
    expect(Math.round(search.getBoundingClientRect().left)).toBe(Math.round(tools.getBoundingClientRect().left));
  });

  it('the search never gets wider than a bar narrower than its minimum (min-width: min(search-min, 100%))', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <div style={{ width: 280 }}>
        <DataTableHeader search={{ value: '', onChange: () => {} }} />
      </div>,
    );
    const bar = el.querySelector<HTMLElement>('.rds-data-table-header')!;
    const search = el.querySelector<HTMLElement>('.rds-data-table-header__search')!;
    expect(search.getBoundingClientRect().width).toBeLessThanOrEqual(bar.getBoundingClientRect().width);
    expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
  });

  it('the view control and the count come after the filters; the action follows the tools in the row, wide and narrow', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(<Example two withView count="8 resultados" />);
      const row = el.querySelector<HTMLElement>('.rds-data-table-header__row')!;
      expect([...row.children].map((c) => c.className)).toEqual(['rds-data-table-header__tools', 'rds-data-table-header__actions']);
      expect(getComputedStyle(row).flexWrap).toBe('nowrap');
      expect(getComputedStyle(row).alignItems).toBe('flex-start');
      const order = [...row.querySelector('.rds-data-table-header__tools')!.children].map((c) => c.className);
      const view = order.findIndex((c) => c.includes('__view'));
      const lastFilters = Math.max(...order.map((c, i) => (c.includes('__wide') || c.includes('__narrow') ? i : -1)));
      expect(view).toBeGreaterThan(lastFilters);
      expect(order.at(-1)).toBe('rds-data-table-header__count');
      expect(visible(row.querySelector('.rds-data-table-header__view')!)).toBe(true);
      cleanup();
    }
  });

  it('the action stays at the end of the first line, on the right, while the tools wrap onto a second line (390)', async () => {
    // At 768 the tools now fit one line: the quick filters scroll instead of wrapping (Figma 09/10).
    for (const width of [390]) {
      await page.viewport(width, 800);
      const el = await render(<Example two withView moreQuick />);
      const row = el.querySelector<HTMLElement>('.rds-data-table-header__row')!;
      const tools = row.querySelector<HTMLElement>('.rds-data-table-header__tools')!;
      const action = row.querySelector<HTMLElement>('[aria-label="Organizar pedidos"]')!;
      const visibleTools = [...tools.children].filter(visible);
      const tops = visibleTools.map((c) => Math.round(c.getBoundingClientRect().top));
      expect(new Set(tops).size).toBeGreaterThan(1);
      const a = action.getBoundingClientRect();
      const b = row.getBoundingClientRect();
      expect(Math.round(a.top)).toBe(Math.round(b.top));
      expect(Math.round(a.right)).toBe(Math.round(b.right));
      // The second line of the tools starts below the action: it does not go down with them.
      expect(a.bottom).toBeLessThanOrEqual(Math.max(...tops));
      expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
      cleanup();
    }
  });

  it('compact, the wide parts hide; mobileCollapse puts the filters and the actions in a Drawer', async () => {
    await page.viewport(390, 800);
    const el = await render(<Example two mobileCollapse />);
    expect(visible(el.querySelector('.rds-data-table-header__wide')!)).toBe(false);
    await userEvent.click(compactToggle(el));
    await settle();
    const drawer = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(drawer.querySelector('[role="group"][aria-label="Canal"]')).not.toBeNull();
    expect(drawer.querySelector('[aria-label="Organizar pedidos"]')).not.toBeNull();
  });
});

describe('DataTableHeader compact (bar below 1024)', () => {
  it('at 390: the search (200, the token), the filter IconButton and the action on one line, 32 tall (Figma 07/10)', async () => {
    await page.viewport(390, 800);
    const el = await render(<Produtos />);
    expect(searchMin(el)).toBe('200px');
    const row = el.querySelector<HTMLElement>('.rds-data-table-header__row')!;
    const search = row.querySelector<HTMLElement>('.rds-data-table-header__search')!;
    const toggle = compactToggle(el);
    const action = row.querySelector<HTMLElement>('[aria-label="Organizar categorias"]')!;
    expect(getComputedStyle(search).minWidth).toBe('min(200px, 100%)');
    expect(search.getBoundingClientRect().width).toBeGreaterThanOrEqual(200);
    const tops = [search, toggle, action].map((n) => n.getBoundingClientRect().top);
    expect(new Set(tops).size).toBe(1);
    expect(row.getBoundingClientRect().height).toBe(32);
    expect(toggle.className).toContain('rds-button--outline');
    const box = toggle.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([32, 32]);
    expect(visible(row.querySelector('.rds-data-table-header__wide')!)).toBe(false);
    expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
  });

  it('the arrangement follows the screen: a bar of 976 on a 1280 screen stays expanded', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <div style={{ width: 976 }}>
        <Produtos />
      </div>,
    );
    expect(visible(el.querySelector('.rds-data-table-header__wide')!)).toBe(true);
    expect(visible(el.querySelector('.rds-data-table-header__narrow')!)).toBe(false);
  });

  it('one filter: an outline IconButton while "Todas"; on, a fill Button with the sliders and "1", named "Categoria, Pago"', async () => {
    await page.viewport(390, 800);
    const el = await render(<Produtos />);
    expect(compactToggle(el).getAttribute('aria-label')).toBe('Categoria');
    await userEvent.click(compactToggle(el));
    await settle();
    // A Drawer (never a popover on a phone) with the Categoria group.
    const drawer = document.querySelector<HTMLElement>('[role="dialog"]')!;
    await userEvent.click(
      [...drawer.querySelectorAll<HTMLElement>('[role="group"][aria-label="Categoria"] .rds-filter-chip')].find((c) => c.textContent?.startsWith('Pago'))!,
    );
    await vi.waitFor(() => expect(compactToggle(el).getAttribute('aria-label')).toBe('Categoria, Pago'));
    const toggle = compactToggle(el);
    expect(toggle.className).toContain('rds-button--fill');
    expect(toggle.textContent).toBe('1');
    const icon = toggle.querySelector('svg')!;
    expect(icon.getBoundingClientRect().left).toBeLessThan(toggle.getBoundingClientRect().left + toggle.getBoundingClientRect().width / 2);
    expect(toggle.getBoundingClientRect().height).toBe(32);
  });

  it('several filters: inactive "Filtros"; active, a fill Button with the number, named "Filtros, N ativos"', async () => {
    await page.viewport(390, 800);
    for (const [active, name] of [
      [0, 'Filtros'],
      [1, 'Filtros, 1 ativo'],
      [3, 'Filtros, 3 ativos'],
    ] as const) {
      const el = await render(<Produtos multiple active={active} />);
      const toggle = compactToggle(el);
      expect(toggle.getAttribute('aria-label')).toBe(name);
      expect(toggle.getAttribute('aria-haspopup')).toBe('dialog');
      if (active === 0) {
        expect(toggle.className).toContain('rds-button--outline');
        expect(toggle.textContent).toBe('');
      } else {
        expect(toggle.className).toContain('rds-button--fill');
        expect(toggle.textContent).toBe(String(active));
      }
      cleanup();
    }
  });

  it('the compact trigger has its Tooltip with the label', async () => {
    await page.viewport(390, 800);
    const el = await render(<Produtos multiple active={2} />);
    compactToggle(el).focus();
    await vi.waitFor(() => expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('Filtros'));
  });

  it('several filters: the compact trigger opens the same Filtros popover, and picking closes it', async () => {
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

  it('the active filters line shows in the compact arrangement too', async () => {
    await page.viewport(390, 800);
    const el = await render(<Produtos multiple active={2} />);
    const active = el.querySelector<HTMLElement>('.rds-data-table-header__active')!;
    expect(visible(active)).toBe(true);
    expect(active.querySelectorAll('.rds-chip')).toHaveLength(2);
  });

  it('at 1280 (expanded) the filter is the Button with its label; no IconButton in view', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <div>
        <Produtos category="paid" />
        <Produtos multiple active={3} searchLabel="Buscar pagamentos" />
      </div>,
    );
    const [one, several] = [...el.querySelectorAll<HTMLElement>('.rds-data-table-header')];
    for (const bar of [one, several]) expect(visible(bar.querySelector('.rds-data-table-header__narrow')!)).toBe(false);
    expect(wideToggle(one).textContent).toBe('Categoria');
    expect(wideToggle(one).className).toContain('rds-button--fill');
    expect(wideToggle(several).textContent).toBe('Filtros · 3');
  });
});
