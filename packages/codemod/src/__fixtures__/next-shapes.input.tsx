import {
  Badge,
  Bubble,
  Card,
  CardContent,
  FileInput,
  FilterChip,
  Item,
  Marker,
  RowActions,
  Sidebar,
  SidebarItem,
  Stat,
} from '@rojaostudio/ds/components';
import type { AvatarVariant, FileInputVariant } from '@rojaostudio/ds/components';
import { Home } from 'lucide-react';

export type Look = { avatar: AvatarVariant; file: FileInputVariant };

export function Shapes({ on, set, layout }: { on: boolean; set: (v: boolean) => void; layout: FileInputVariant }) {
  return (
    <>
      <Card surface="default" size="default">
        <CardContent>a</CardContent>
      </Card>
      <Card surface="tint">
        <CardContent>b</CardContent>
      </Card>
      <Card surface="outline" size="sm">
        <CardContent>c</CardContent>
      </Card>
      <Item variant="default" size="default" title="Pedido" />
      <Item variant="muted" title="Cliente" />
      <Item variant="outline" size="sm" title="Nota" />
      <Marker variant="default">Buscando…</Marker>
      <Marker variant="separator">Hoje</Marker>
      <FileInput variant="dropzone" label="Comprovante" />
      <FileInput variant={layout} label="Anexo" />
      <Stat label="Receita" value="R$ 10" tone="positive" />
      <Stat label="Faltou" value="2" tone="negative" />
      <Stat label="Pedidos" value="3" tone="default" />
      <Stat label="Estoque" value="7" tone="warning" />
      <Stat label="Zerados" value="0" tone="muted" />
      <Sidebar tone="light">
        <SidebarItem icon={<Home />} href="/" active>
          Painel
        </SidebarItem>
      </Sidebar>
      <FilterChip active={on} onActiveChange={set}>
        Todos
      </FilterChip>
      <FilterChip defaultActive>Entradas</FilterChip>
      <Bubble variant="fill" align="end">Oi</Bubble>
      <Bubble variant="muted">Olá</Bubble>
      <Bubble variant="tinted">Posso ajudar?</Bubble>
      <Bubble variant="outline">Sobre a cor</Bubble>
      <Bubble variant="ghost">Uma resposta longa.</Bubble>
      <Bubble variant="error" align="end">Não enviada</Bubble>
      <Bubble variant="typing" />
      <Badge tone="accent" variant="highlight">Destaque</Badge>
      <Badge tone="action" variant="soft">Nova</Badge>
      <RowActions
        primaryLabel="Ver"
        items={[
          { label: 'Editar', variant: 'default', onClick: () => {} },
          { label: 'Excluir', variant: "danger", onClick: () => {} },
          { label: 'Duplicar', onClick: () => {} },
        ]}
      />
    </>
  );
}
