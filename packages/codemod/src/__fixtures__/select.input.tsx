import { Select } from '@rojaostudio/ds/components';

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
        helper="A lista muda na hora"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        options={[
          { value: 'new', label: 'Mais novos' },
          { value: 'old', label: 'Mais antigos', disabled: true },
          { value: 3, label: `Top ${3}` },
        ]}
      />
      <Select label="Tamanho" value={size} onChange={e => setSize(e.currentTarget.value)} size="sm">
        <option value="" disabled>
          Escolha
        </option>
        <option value="p">Pequeno</option>
        <option value={'m'}>Médio</option>
      </Select>
      <Select label="Tipo" error="Obrigatório" value={kind} onChange={(e) => { form.setKind(e.target.value); }} options={items.map((o) => ({ value: o.id, label: o.name, disabled: o.off }))} />
      <Select label="Outro" placeholder="Nenhum" options={items.map(item => ({ value: item.id, label: item.name }))} />
    </div>
  );
}
