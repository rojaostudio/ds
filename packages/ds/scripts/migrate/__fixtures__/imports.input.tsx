import { Button } from '@rojao/ds/components';
import { Modal } from '@rojaostudio/ds/components/modal';
import { Chip } from '@rojaostudio/ds/components/chips';
import { toast, Toaster } from '@rojaostudio/ds/components/toaster';
import { House } from '@rojao/ds/icons';

export function Imports({ open, close }: { open: boolean; close: () => void }) {
  return (
    <>
      <Toaster position="top-right" />
      <Button onClick={() => toast('Oi')}>
        <House />
      </Button>
      <Chip>Tag</Chip>
      <Modal open={open} onClose={close} title="Título" />
    </>
  );
}
