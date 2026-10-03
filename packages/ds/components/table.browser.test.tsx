import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { Button } from './button';
import { Status } from './status';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableStatus, type TableStatus as TableStatusValue } from './table';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

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
