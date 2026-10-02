import { Select, Button, toast } from '@rojaostudio/ds/components';

export function Annotated({ busy, save }: { busy: boolean; save: () => Promise<void> }) {
  // TODO(ds-2.0): toast.promise saiu: chame toast({ title, tone }) você mesmo no sucesso e no erro da promise.
  const run = () => toast.promise(save(), { loading: 'Salvando', success: 'Salvo', error: 'Erro' });
  return (
    <form>
      {/* TODO(ds-2.0): Select virou Radix: troque options[] (ou <option>) por filhos <SelectItem value>…</SelectItem>, onChange(evento) por onValueChange(valor), helper→hint, error→errorMessage. */}
      <Select options={[]} />
      {busy && (
        // TODO(ds-2.0): variant="tonal" saiu do Button 2.0: escolha fill, outline ou ghost (o tom vem de `tone`).
        <Button variant="tonal" onClick={run}>
          Salvar
        </Button>
      )}
      <Button variant="outline" tone="danger" size="sm">
        Cancelar
      </Button>
    </form>
  );
}
