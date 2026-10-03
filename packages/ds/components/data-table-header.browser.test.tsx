import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Button } from './button';
import { DataTableHeader, type DataTableFilterDef } from './data-table-header';
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

function Example({ two = false, mobileCollapse = false, onSearch }: { two?: boolean; mobileCollapse?: boolean; onSearch?: (v: string) => void }) {
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
      pillFilters={[{ key: 'late', label: 'Atrasados', active: late, count: 2, onClick: () => setLate((v) => !v) }]}
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
        <Example two />
      </div>,
      mode,
    );
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

  it('quick filters are FilterChips; one filter is a dropdown whose trigger fills when a value is chosen', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Example />);
    const chip = el.querySelector<HTMLButtonElement>('[data-pill-filter] .rds-filter-chip')!;
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

  it('two filters collapse into Filtros (with the count); the active one stays as a Chip that removes it', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Example two />);
    const wide = el.querySelector<HTMLElement>('.rds-data-table-header__wide')!;
    const toggle = wide.querySelector<HTMLButtonElement>('[data-filter-toggle]')!;
    expect(toggle.textContent).toBe('Filtros1');
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
    expect(el.querySelector('.rds-data-table-header__wide [data-filter-toggle]')!.textContent).toBe('Filtros2');
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
});
