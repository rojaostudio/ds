import { Table, TableHead, TableBody, TableRow, Th, Td } from '@rojaostudio/ds/components';

export function Orders({ rows, open }: { rows: { id: string; total: string }[]; open: (id: string) => void }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <Th>Pedido</Th>
          <Th align="center">Total</Th>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id} onClick={() => open(r.id)}>
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
