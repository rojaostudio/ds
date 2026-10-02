import { Menu, MenuItem, MenuSeparator, IconButton } from '@rojaostudio/ds/components';
import { MoreHorizontal } from 'lucide-react';

export function RowMenu({ edit, remove }: { edit: () => void; remove: () => void }) {
  return (
    <Menu
      trigger={<IconButton icon={<MoreHorizontal />} aria-label="Ações" />}
      placement="bottom-end"
      minWidth={200}
    >
      <MenuItem onClick={edit}>Editar</MenuItem>
      <MenuSeparator />
      <MenuItem variant="danger" onClick={remove}>
        Excluir
      </MenuItem>
    </Menu>
  );
}
