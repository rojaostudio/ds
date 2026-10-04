import { Badge, Card, CardContent, Bubble, FilterChip, Spinner } from '@rojaostudio/ds/components';

// A 1.x run over a file that mixes 1.x usages and 2.0.0-next values of names both have: the 2.0 values get the vocabulary too.
export function Mixed({ on }: { on: boolean }) {
  return (
    <>
      <Spinner tone="neutral" size="md" />
      <Spinner size="lg" tone="inverse" />
      <Badge tone="accent" variant="soft">Destaque</Badge>
      <Card variant="soft" size="md">
        <CardContent>a</CardContent>
      </Card>
      <Card variant="outline">
        <CardContent>b</CardContent>
      </Card>
      <FilterChip pressed={on}>Todos</FilterChip>
      <FilterChip pressed={on} defaultPressed>
        Entradas
      </FilterChip>
      <Bubble align="end" variant="fill">Oi</Bubble>
    </>
  );
}
