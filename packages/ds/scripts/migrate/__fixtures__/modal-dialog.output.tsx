import { Dialog } from '@rojaostudio/ds/components';
import type { DialogProps } from '@rojaostudio/ds/components';

export function Dialogs({ open, setOpen, handlers }: { open: boolean; setOpen: (v: boolean) => void; handlers: { close: () => void } }) {
  return (
    <>
      <Dialog open={open} onOpenChange={() => setOpen(false)} title="Novo público" description="Quem recebe">
        <p>Conteúdo</p>
      </Dialog>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handlers.close(); }} title="Grande" size="lg" />
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) ((_e?: unknown) => handlers.close())(); }} title="Pequeno" size="sm" />
    </>
  );
}

export type P = DialogProps;
