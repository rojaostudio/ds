import { Table, TableHead, TableBody, TableRow, Th, Td } from '@rojaostudio/ds/components';

export function Orders({ rows }: { rows: { id: string; total: string }[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow header>
          <Th>Pedido</Th>
          <Th align="right">Total</Th>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <Td>{r.id}</Td>
            <Td align="right" muted>
              {r.total}
            </Td>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
