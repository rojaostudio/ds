import { afterEach, describe, expect, it } from 'vitest';
import { Table, TableBody, TableCell, TableGroupRow, TableHead, TableHeader, TableRow } from './table';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// ds#137: the row that opens a group of rows.

const Grouped = () => (
  <Table caption="Auditoria">
    <TableHeader>
      <TableRow>
        <TableHead>Quando</TableHead>
        <TableHead>O quê</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableGroupRow label="Hoje, 12/10" count="2 registros" colSpan={2} />
      <TableRow>
        <TableCell>10:42</TableCell>
        <TableCell>Preço alterado</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>09:15</TableCell>
        <TableCell>Produto criado</TableCell>
      </TableRow>
    </TableBody>
    <TableBody>
      <TableGroupRow label="Ontem, 11/10" colSpan={2} />
      <TableRow>
        <TableCell>18:03</TableCell>
        <TableCell>Pedido cancelado</TableCell>
      </TableRow>
    </TableBody>
  </Table>
);

describe('TableGroupRow', () => {
  it('spans every column with a rowgroup header, the count on the right, a line between groups', async () => {
    const el = await render(<Grouped />);
    const groups = el.querySelectorAll<HTMLTableCellElement>('th[scope="rowgroup"]');
    expect(groups).toHaveLength(2);
    expect(groups[0].colSpan).toBe(2);
    expect(groups[0].textContent).toBe('Hoje, 12/102 registros');
    const table = el.querySelector('table')!.getBoundingClientRect();
    expect(Math.round(groups[0].getBoundingClientRect().width)).toBe(Math.round(table.width));
    expect(getComputedStyle(groups[0]).fontWeight).toBe('600');
    expect(getComputedStyle(groups[0]).borderTopWidth).toBe('0px');
    expect(getComputedStyle(groups[1]).borderTopWidth).not.toBe('0px');
    const count = el.querySelector<HTMLElement>('.rds-table__group-count')!.getBoundingClientRect();
    expect(Math.round(count.right)).toBeGreaterThan(Math.round(table.right) - 24);
  });

  it.each(MODES)('passes axe (%s)', async (mode) => {
    const el = await render(<Grouped />, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});
