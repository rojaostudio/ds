import { ToggleGroup, ToggleGroupItem } from '@rojaostudio/ds/components';
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
        type="single" onValueChange={(next) => { if (next) setView(next); }}>
        <ToggleGroupItem value="list">Lista</ToggleGroupItem>
        <ToggleGroupItem value="grid" disabled>Grade</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="multiple" aria-label="Estilo" size="sm" value={marks} onValueChange={setMarks}>
        <ToggleGroupItem value="b" icon={<Bold />}>Negrito</ToggleGroupItem>
        <ToggleGroupItem value="i" icon={<Italic />}>Itálico</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup aria-label="Período" value={period} type="single" onValueChange={(next) => pick(next || null)}>
        <ToggleGroupItem value="d">Dia</ToggleGroupItem>
        <ToggleGroupItem value="w">Semana</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
