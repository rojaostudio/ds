import { Select } from '@rojaostudio/ds/components';

type Option = { value: string; label: string };

export function Shapes({ opts, base, handle, touch }: { opts: Option[]; base: Option[]; handle: () => void; touch: () => void }) {
  return (
    <form>
      <Select label="Lista" options={opts} />
      <Select label="Espalhada" options={[...base, { value: 'x', label: 'X' }]} />
      <Select label="Bloco" options={opts.map((o) => { return { value: o.value, label: o.label }; })} />
      <Select label="Junto" options={[{ value: 'a', label: 'A' }]}>
        <option value="b">B</option>
      </Select>
      <Select label="Evento" onChange={handle} options={[{ value: 'a', label: 'A' }]} />
      <Select label="Nativo" onBlur={touch} options={[{ value: 'a', label: 'A' }]} />
      <Select label="Sem valor">
        <option>Só texto</option>
      </Select>
      <Select label="Vazio no meio">
        <option value="a">A</option>
        <option value="">Nenhum</option>
      </Select>
    </form>
  );
}
