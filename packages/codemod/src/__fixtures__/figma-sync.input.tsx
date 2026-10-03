import { Card, CardContent, DataTableHeader } from '@rojaostudio/ds/components';

type Pill = { key: string; label: string; active: boolean; count?: number; onClick: () => void };

export function Orders({ q, setQ, pills }: { q: string; setQ: (v: string) => void; pills: Pill[] }) {
  return (
    <div>
      <DataTableHeader search={{ value: q, onChange: setQ }} pillFilters={pills} />
      <DataTableHeader pillFilters={pills.filter((p) => p.count)} />
      <Card variant="outlined">
        <CardContent>Resumo</CardContent>
      </Card>
      <Card variant="elevated">
        <CardContent>Plano</CardContent>
      </Card>
    </div>
  );
}
