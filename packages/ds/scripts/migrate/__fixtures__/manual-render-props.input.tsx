import { Menu, MenuItem, Popover, Button } from '@rojaostudio/ds/components';

export function Actions({ edit }: { edit: () => void }) {
  return (
    <>
      <Menu trigger={<Button>Ações</Button>}>
        {({ close }) => (
          <MenuItem
            onClick={() => {
              edit();
              close();
            }}
          >
            Editar
          </MenuItem>
        )}
      </Menu>
      <Popover trigger={<Button>Filtros</Button>}>
        {({ close }) => <Button onClick={close}>Aplicar</Button>}
      </Popover>
    </>
  );
}
