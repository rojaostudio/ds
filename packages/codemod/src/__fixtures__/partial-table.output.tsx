import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@rojaostudio/ds/components';

export function Orders({ rows }: { rows: { id: string; total: string }[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead align="start">Pedido</TableHead>
          <TableHead align="end">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.id}</TableCell>
            <TableCell align="end">{r.total}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
