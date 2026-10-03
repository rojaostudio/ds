import { Drawer, BottomSheet, Button } from '@rojaostudio/ds/components';
import type { DrawerProps, BottomSheetProps } from '@rojaostudio/ds/components';

type Side = DrawerProps['side'];
type Bottom = BottomSheetProps;

export function Panels({ open, close, side }: { open: boolean; close: () => void; side: Side; bottom?: Bottom }) {
  return (
    <>
      <Drawer open={open} onClose={close} title="Filtros" subtitle="Refine a lista" side={side}>
        <Button onClick={close}>Aplicar</Button>
      </Drawer>
      <BottomSheet open={open} onClose={() => close()} title="Ações" snap="auto">
        <Button onClick={close}>Fechar</Button>
      </BottomSheet>
    </>
  );
}
