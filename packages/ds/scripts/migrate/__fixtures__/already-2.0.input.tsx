import { Drawer, Toggle, Button, Select, SelectItem, Table, TableHeader, TableRow, TableHead } from '@rojaostudio/ds/components';

export function Done({ open, setOpen, bold, setBold }: { open: boolean; setOpen: (v: boolean) => void; bold: boolean; setBold: (v: boolean) => void }) {
  return (
    <>
      <Drawer open={open} onOpenChange={setOpen} title="Ações" description="Escolha uma">
        <Button tone="neutral" variant="ghost">Fechar</Button>
      </Drawer>
      <Toggle pressed={bold} onPressedChange={setBold} aria-label="Negrito" />
      <Select label="Plano" onValueChange={() => {}}>
        <SelectItem value="m">Mensal</SelectItem>
      </Select>
      <Table caption="Pedidos">
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    </>
  );
}
