import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, type ReactNode } from 'react';
import { page } from 'vitest/browser';
import { Card, CardContent, CardHeader } from './card';
import { Button } from './button';
import { Status } from './status';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableStatus, type TableStatus as TableStatusValue } from './table';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(async () => {
  cleanup();
  await page.viewport(1280, 800);
});

const STATUSES: Exclude<TableStatusValue, 'default'>[] = ['loading', 'empty', 'noResults', 'error'];

const header = (
  <TableHeader>
    <TableRow>
      <TableHead>Pedido</TableHead>
      <TableHead>Status</TableHead>
      <TableHead align="end">Itens</TableHead>
    </TableRow>
  </TableHeader>
);

describe.each(MODES)('Table (%s)', (mode) => {
  it('header, text, slot and number cells, a sortable column and the visible caption pass axe', async () => {
    const el = await render(
      <Table caption="Pedidos abertos" showCaption>
        <TableHeader>
          <TableRow>
            <TableHead sort="ascending" onSort={() => {}}>
              Pedido
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead align="end" sort="none" onSort={() => {}}>
              Itens
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>#4821 · Mesa de jantar</TableCell>
            <TableCell type="slot">
              <Status tone="success">Enviado</Status>
            </TableCell>
            <TableCell align="end">4</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>#4822 · Luminária</TableCell>
            <TableCell type="slot">
              <Status tone="neutral">Aguardando</Status>
            </TableCell>
            <TableCell align="end">1</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it.each(STATUSES)('status %s passes axe', async (status) => {
    const el = await render(
      <Table caption="Pedidos abertos" status={status}>
        {header}
        <TableBody>
          <TableStatus status={status} columns={3} numericColumns={[2]} action={status !== 'loading' && <Button variant="outline">Tentar de novo</Button>} />
        </TableBody>
      </Table>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Table behaviour', () => {
  it('is a named, focusable scroll region with the caption; a sortable header is a button with aria-sort', async () => {
    const onSort = vi.fn();
    const el = await render(
      <Table caption="Pedidos abertos">
        <TableHeader>
          <TableRow>
            <TableHead sort="descending" onSort={onSort}>
              Pedido
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>#4821</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const region = el.querySelector('[role="region"]')!;
    expect(region.getAttribute('tabindex')).toBe('0');
    const caption = el.querySelector('caption')!;
    expect(region.getAttribute('aria-labelledby')).toBe(caption.id);
    expect(caption.className).toBe('rds-visually-hidden');
    const th = el.querySelector('th')!;
    expect(th.getAttribute('scope')).toBe('col');
    expect(th.getAttribute('aria-sort')).toBe('descending');
    await act(async () => th.querySelector('button')!.click());
    expect(onSort).toHaveBeenCalledOnce();
  });

  it('status: loading is busy with 3 skeleton rows; empty, noResults and error span the columns; error is an alert', async () => {
    const el = await render(
      <div>
        {(['loading', 'empty', 'noResults', 'error'] as const).map((status) => (
          <Table key={status} caption={status} status={status}>
            {header}
            <TableBody>
              <TableStatus status={status} columns={3} />
            </TableBody>
          </Table>
        ))}
      </div>,
    );
    const [loading, empty, noResults, error] = el.querySelectorAll('table');
    expect(loading.getAttribute('aria-busy')).toBe('true');
    expect(loading.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(loading.querySelectorAll('tbody .rds-skeleton[aria-hidden="true"]')).toHaveLength(9);
    expect(empty.getAttribute('aria-busy')).toBeNull();
    expect(empty.querySelector('td')!.getAttribute('colspan')).toBe('3');
    expect(empty.querySelector('h3')!.textContent).toBe('Nada por aqui ainda');
    expect(noResults.querySelector('h3')!.textContent).toBe('Nada encontrado');
    expect(error.querySelector('[role="alert"] h3')!.textContent).toBe('Não deu para carregar');
    expect(error.querySelector('.rds-tile')!.className).toContain('rds-tile--danger-soft');
  });
});

describe('Table inside a Card at 390', () => {
  const COLUMNS = ['Pedido', 'Cliente', 'Status', 'Data', 'Itens', 'Total'];
  const wide = (
    <Card>
      <CardHeader title="Pedidos" />
      <CardContent>
        <Table caption="Pedidos abertos">
          <TableHeader>
            <TableRow>
              {COLUMNS.map((c, i) => (
                <TableHead key={c} align={i >= 4 ? 'end' : 'start'}>
                  {c}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[4821, 4822].map((n) => (
              <TableRow key={n}>
                <TableCell>#{n}</TableCell>
                <TableCell>Marina Albuquerque</TableCell>
                <TableCell>Aguardando envio</TableCell>
                <TableCell>04/10/2026</TableCell>
                <TableCell align="end">12</TableCell>
                <TableCell align="end">R$ 1.249,90</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  // Where the Card sits: the page's flow, and every ancestor sized by its content that used to take the table's
  // min-content and grow past the screen (the app's main as a flex item without min-width: 0, a grid item in an
  // auto track, a start-aligned stack, an inline-block).
  const PLACES = {
    'the page flow': (c: ReactNode) => c,
    'a flex item without min-width: 0': (c: ReactNode) => (
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>{c}</div>
      </div>
    ),
    'a grid item': (c: ReactNode) => (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
        <div>{c}</div>
      </div>
    ),
    'a start-aligned stack': (c: ReactNode) => <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>{c}</div>,
    'an inline-block': (c: ReactNode) => <div style={{ display: 'inline-block' }}>{c}</div>,
  };

  it.each(Object.keys(PLACES) as (keyof typeof PLACES)[])('in %s: the 6 columns scroll inside the table, the Card stays within the screen', async (place) => {
    await page.viewport(390, 800);
    const el = await render(PLACES[place](wide));
    const region = el.querySelector<HTMLElement>('.rds-table')!;
    const card = el.querySelector<HTMLElement>('.rds-card')!;
    expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    expect(card.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    expect(card.getBoundingClientRect().width).toBeLessThanOrEqual(window.innerWidth - 32);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    // It really scrolls: the last column comes into view.
    region.scrollLeft = region.scrollWidth;
    expect(region.scrollLeft).toBeGreaterThan(0);
  });

  it('at 1280 a hugging parent still hugs the whole table (no squeeze), and in the page flow it fills the Card', async () => {
    await page.viewport(1280, 800);
    const el = await render(PLACES['a start-aligned stack'](wide));
    const region = el.querySelector<HTMLElement>('.rds-table')!;
    expect(region.scrollWidth).toBe(region.clientWidth);
    expect(region.querySelector('table')!.getBoundingClientRect().width).toBeCloseTo(region.clientWidth, 0);
    cleanup();
    const flow = await render(wide);
    const card = flow.querySelector<HTMLElement>('.rds-card__content')!;
    const table = flow.querySelector<HTMLElement>('.rds-table')!;
    expect(table.getBoundingClientRect().width).toBeCloseTo(card.clientWidth - 48, 0);
  });

  it('passes axe at 390', async () => {
    await page.viewport(390, 800);
    const el = await render(wide);
    expect(await axeViolations(el)).toEqual([]);
  });
});
