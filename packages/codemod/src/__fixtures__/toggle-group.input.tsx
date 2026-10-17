import { ToggleGroup } from '@rojaostudio/ds/components';
import { Bold, Italic } from 'lucide-react';

export function Views({ view, setView, marks, setMarks, period, pick }: {
  view: string;
  setView: (v: string) => void;
  marks: string[];
  setMarks: (v: string[]) => void;
  period: string | null;
  pick: (v: string | null) => void;
}) {
  return (
    <div>
      <ToggleGroup
        aria-label="Vista"
        value={view}
        onChange={setView}
        options={[
          { value: 'list', label: 'Lista' },
          { value: 'grid', label: 'Grade', disabled: true },
        ]}
      />
      <ToggleGroup type="multi" aria-label="Estilo" size="sm" value={marks} onChange={setMarks} options={[{ value: 'b', label: 'Negrito', icon: <Bold /> }, { value: 'i', label: 'Itálico', icon: <Italic /> }]} />
      <ToggleGroup aria-label="Período" allowDeselect selectedTone="neutral" value={period} onChange={(v) => pick(v)} options={[{ value: 'd', label: 'Dia' }, { value: 'w', label: 'Semana' }]} />
    </div>
  );
}
