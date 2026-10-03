import { IconButton } from '@rojaostudio/ds/components';
import { Trash, X } from 'lucide-react';

export function IconButtons({ close }: { close: () => void }) {
  return (
    <div>
      <IconButton icon={<X />} label="Fechar" onClick={close} tone="neutral" variant="ghost" />
      <IconButton icon={<X />} label="Fechar" size="sm" />
      <IconButton icon={<Trash />} label="Excluir" tone="danger" variant="ghost" />
      <IconButton icon={<Trash />} label="Excluir" variant="outline" tone="neutral" />
    </div>
  );
}
