import { Bubble, Card, CardContent, FilterChip, Item, Marker, PageShell, RowActions, Sidebar, Stat } from '@rojaostudio/ds/components';
import type { CardSurface, MarkerVariant, SidebarTone } from '@rojaostudio/ds/components';

export type Old = { card: CardSurface; marker: MarkerVariant; sidebar: SidebarTone };

export function Manual({ v, on, kind }: { v: 'fill' | 'muted'; on: boolean; kind: 'danger' | 'default' }) {
  return (
    <>
      <Sidebar tone="dark">
        <span />
      </Sidebar>
      <Bubble variant={v}>Oi</Bubble>
      <Card surface={on ? 'tint' : 'default'}>
        <CardContent>a</CardContent>
      </Card>
      <Stat label="Receita" value="1" tone={on ? 'positive' : 'muted'} />
      <Item variant={on ? 'muted' : 'default'} title="Pedido" />
      <Marker variant={on ? 'default' : 'border'}>Nota</Marker>
      <FilterChip active={on} pressed={on}>
        Todos
      </FilterChip>
      <PageShell maxWidth="default">x</PageShell>
      <RowActions primaryLabel="Ver" items={[{ label: 'Excluir', variant: kind, onClick: () => {} }]} />
    </>
  );
}
