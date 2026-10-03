import { FilterChip, Tooltip, IconButton } from '@rojaostudio/ds/components';
import { Info } from 'lucide-react';

export function Filters({ active, set }: { active: string; set: (v: string) => void }) {
  return (
    <div>
      <FilterChip active={active === 'all'} onClick={() => set('all')}>Todos</FilterChip>
      <FilterChip active={active === 'in'} count={3} asChild><a href="/extrato?tipo=in">Entradas</a></FilterChip>
      <Tooltip text="Mais informações" side="bottom">
        <IconButton icon={<Info />} label="Ajuda" tone="neutral" variant="ghost" />
      </Tooltip>
    </div>
  );
}
