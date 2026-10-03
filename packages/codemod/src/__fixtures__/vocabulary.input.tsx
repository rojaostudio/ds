import { Badge, Card, CardContent, ChatBubble, FilterChip, Item, Spinner } from '@rojaostudio/ds/components';

// A 1.x run over a file that mixes 1.x usages and 2.0 ones: the 2.0 usages get the vocabulary too.
export function Mixed({ on }: { on: boolean }) {
  return (
    <>
      <Spinner tone="default" size="default" />
      <Spinner size="xl" color="inverse" />
      <Badge tone="accent" variant="highlight">Destaque</Badge>
      <Card surface="tint" size="default">
        <CardContent>a</CardContent>
      </Card>
      <Card variant="outlined">
        <CardContent>b</CardContent>
      </Card>
      <Item variant="muted" title="Pedido" />
      <FilterChip label="Todos" active={on} />
      <FilterChip pressed={on} defaultActive>
        Entradas
      </FilterChip>
      <ChatBubble variant="user">Oi</ChatBubble>
    </>
  );
}
