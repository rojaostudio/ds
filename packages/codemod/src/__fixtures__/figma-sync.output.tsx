import { Card, CardContent, DataTableHeader, FilterChipGroup, FilterChip } from '@rojaostudio/ds/components';

type Pill = { key: string; label: string; active: boolean; count?: number; onClick: () => void };

export function Orders({ q, setQ, pills }: { q: string; setQ: (v: string) => void; pills: Pill[] }) {
  return (
    <div>
      <DataTableHeader search={{ value: q, onChange: setQ }} quickFilters={<FilterChipGroup aria-label="Filtros rápidos">{pills.map((quick) => (<FilterChip key={quick.key} pressed={quick.active} count={quick.count} onClick={quick.onClick}>{quick.label}</FilterChip>))}</FilterChipGroup>} />
      <DataTableHeader quickFilters={<FilterChipGroup aria-label="Filtros rápidos">{pills.filter((p) => p.count).map((quick) => (<FilterChip key={quick.key} pressed={quick.active} count={quick.count} onClick={quick.onClick}>{quick.label}</FilterChip>))}</FilterChipGroup>} />
      <Card variant="outline">
        <CardContent>Resumo</CardContent>
      </Card>
      <Card>
        <CardContent>Plano</CardContent>
      </Card>
    </div>
  );
}
