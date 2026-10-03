import { Button } from '@rojaostudio/ds/components';
import { Dialog } from '@rojaostudio/ds/components/dialog';
import { Chip } from '@rojaostudio/ds/components/chip';
import { toast, Toaster } from '@rojaostudio/ds/components/toast';
import { House } from '@rojaostudio/ds/icons';

export function Imports({ open, close }: { open: boolean; close: () => void }) {
  return (
    <>
      <Toaster />
      <Button onClick={() => toast({ title: 'Oi' })}>
        <House />
      </Button>
      <Chip>Tag</Chip>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) close(); }} title="Título" />
    </>
  );
}
