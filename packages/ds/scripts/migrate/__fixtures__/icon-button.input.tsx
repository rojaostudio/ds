import { IconButton } from '@rojaostudio/ds/components';
import { Trash, X } from 'lucide-react';

export function IconButtons({ close }: { close: () => void }) {
  return (
    <div>
      <IconButton icon={<X />} aria-label="Fechar" onClick={close} />
      <IconButton icon={<X />} aria-label="Fechar" size="sm" variant="filled" color="primary" />
      <IconButton icon={<Trash />} aria-label="Excluir" color="danger" />
      <IconButton icon={<Trash />} aria-label="Excluir" variant="outline" color="secondary" />
    </div>
  );
}
