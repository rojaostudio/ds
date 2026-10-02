import { Sheet, Drawer, Button } from '@rojaostudio/ds/components';
import type { SheetProps, DrawerProps } from '@rojaostudio/ds/components';

type Side = SheetProps['side'];
type Bottom = DrawerProps;

export function Panels({ open, close, side }: { open: boolean; close: () => void; side: Side; bottom?: Bottom }) {
  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) close(); }} title="Filtros" description="Refine a lista" side={side}>
        <Button onClick={close}>Aplicar</Button>
      </Sheet>
      <Drawer open={open} onOpenChange={() => close()} title="Ações">
        <Button onClick={close}>Fechar</Button>
      </Drawer>
    </>
  );
}
