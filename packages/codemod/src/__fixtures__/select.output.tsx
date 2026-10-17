import { Select, SelectItem } from '@rojaostudio/ds/components';

type Option = { id: string; name: string; off: boolean };

export function Filters({ sort, setSort, size, setSize, kind, form, items }: {
  sort: string;
  setSort: (v: string) => void;
  size: string;
  setSize: (v: string) => void;
  kind: string;
  form: { setKind: (v: string) => void };
  items: Option[];
}) {
  return (
    <div>
      <Select
        label="Ordem"
        hint="A lista muda na hora"
        value={sort}
        onValueChange={setSort}>
        <SelectItem value="new">Mais novos</SelectItem>
        <SelectItem value="old" disabled>Mais antigos</SelectItem>
        <SelectItem value="3">{`Top ${3}`}</SelectItem>
      </Select>
      <Select label="Tamanho" value={size} onValueChange={setSize} placeholder="Escolha">
        <SelectItem value="p">Pequeno</SelectItem>
        <SelectItem value={'m'}>Médio</SelectItem>
      </Select>
      <Select label="Tipo" errorMessage="Obrigatório" value={kind} onValueChange={(value) => form.setKind(value)}>
        {items.map((o) => <SelectItem key={o.id} value={o.id} disabled={o.off}>{o.name}</SelectItem>)}
      </Select>
      <Select label="Outro" placeholder="Nenhum">
        {items.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
      </Select>
    </div>
  );
}
