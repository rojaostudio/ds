import { ToggleGroup } from '@rojaostudio/ds/components';
import { Bold } from 'lucide-react';

export function Groups({ view, setView, kind, items, free }: {
  view: string;
  setView: (v: string) => void;
  kind: 'single' | 'multi';
  items: { value: string; label: string }[];
  free: boolean;
}) {
  return (
    <div>
      <ToggleGroup aria-label="Lista" value={view} onChange={setView} options={items} />
      <ToggleGroup aria-label="Ícone" value={view} onChange={setView} options={[{ value: 'b', icon: <Bold /> }]} />
      <ToggleGroup aria-label="Grande" size="lg" value={view} onChange={setView} options={[{ value: 'a', label: 'A' }]} />
      <ToggleGroup aria-label="Rótulo" label="Vista" value={view} onChange={setView} options={[{ value: 'a', label: 'A' }]} />
      <ToggleGroup aria-label="Largo" stretch value={view} onChange={setView} options={[{ value: 'a', label: 'A' }]} />
      <ToggleGroup aria-label="Tipo" type={kind} value={view} onChange={setView} options={[{ value: 'a', label: 'A' }]} />
      <ToggleGroup aria-label="Solto" allowDeselect={free} value={view} onChange={setView} options={[{ value: 'a', label: 'A' }]} />
    </div>
  );
}
