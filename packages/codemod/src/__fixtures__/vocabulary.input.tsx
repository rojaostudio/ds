import { Badge, Card, CardBody, ChatBubble, FilterChip, Spinner } from '@rojaostudio/ds/components';

// A 1.x run over a file that mixes 1.x usages and 2.0.0-next values of names both have: the 2.0 values get the vocabulary too.
export function Mixed({ on }: { on: boolean }) {
  return (
    <>
      <Spinner tone="default" size="default" />
      <Spinner size="xl" color="inverse" />
      <Badge tone="accent" variant="highlight">Destaque</Badge>
      <Card surface="tint" size="default">
        <CardBody>a</CardBody>
      </Card>
      <Card variant="outlined">
        <CardBody>b</CardBody>
      </Card>
      <FilterChip label="Todos" active={on} />
      <FilterChip pressed={on} defaultActive>
        Entradas
      </FilterChip>
      <ChatBubble variant="user">Oi</ChatBubble>
    </>
  );
}
