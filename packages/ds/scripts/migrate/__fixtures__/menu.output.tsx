import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, IconButton } from '@rojaostudio/ds/components';
import { MoreHorizontal } from 'lucide-react';

export function RowMenu({ edit, remove }: { edit: () => void; remove: () => void }) {
  return (
    <DropdownMenu
      trigger={<IconButton icon={<MoreHorizontal />} label="Ações" tone="neutral" variant="ghost" />}
      align="end"
    >
      <DropdownMenuItem onSelect={edit}>Editar</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem tone="danger" onSelect={remove}>
        Excluir
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
