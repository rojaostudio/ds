import { FilterChip, Tooltip, IconButton } from '@rojaostudio/ds/components';
import { Info } from 'lucide-react';

export function Filters({ active, set }: { active: string; set: (v: string) => void }) {
  return (
    <div>
      <FilterChip label="Todos" active={active === 'all'} onClick={() => set('all')} />
      <FilterChip label="Entradas" active={active === 'in'} count={3} href="/extrato?tipo=in" />
      <Tooltip content="Mais informações" side="bottom" wrapperClassName="flex-1">
        <IconButton icon={<Info />} aria-label="Ajuda" />
      </Tooltip>
    </div>
  );
}
