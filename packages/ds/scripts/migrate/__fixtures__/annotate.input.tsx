import { Select, Button, toast } from '@rojaostudio/ds/components';

export function Annotated({ busy, save }: { busy: boolean; save: () => Promise<void> }) {
  const run = () => toast.promise(save(), { loading: 'Salvando', success: 'Salvo', error: 'Erro' });
  return (
    <form>
      <Select options={[]} />
      {busy && (
        <Button variant="tonal" onClick={run}>
          Salvar
        </Button>
      )}
      <Button variant="outline" color="danger" size="sm">
        Cancelar
      </Button>
    </form>
  );
}
