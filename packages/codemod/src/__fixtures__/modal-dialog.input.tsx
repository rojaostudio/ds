import { Modal } from '@rojaostudio/ds/components';
import type { ModalProps } from '@rojaostudio/ds/components';

export function Dialogs({ open, setOpen, handlers }: { open: boolean; setOpen: (v: boolean) => void; handlers: { close: () => void } }) {
  return (
    <>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo público" subtitle="Quem recebe" size="md">
        <p>Conteúdo</p>
      </Modal>
      <Modal open={open} onClose={handlers.close} title="Grande" size="lg" closeOnBackdrop hideClose={false} />
      <Modal open={open} onClose={(_e?: unknown) => handlers.close()} title="Pequeno" size="sm" />
    </>
  );
}

export type P = ModalProps;
