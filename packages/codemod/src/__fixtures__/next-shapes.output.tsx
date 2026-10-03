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
import type { AvatarContent, FileInputLayout } from '@rojaostudio/ds/components';
import { Home } from 'lucide-react';

export type Look = { avatar: AvatarContent; file: FileInputLayout };

export function Shapes({ on, set, layout }: { on: boolean; set: (v: boolean) => void; layout: FileInputLayout }) {
  return (
    <>
      <Card variant="surface" size="md">
        <CardContent>a</CardContent>
      </Card>
      <Card variant="soft">
        <CardContent>b</CardContent>
      </Card>
      <Card variant="outline" size="sm">
        <CardContent>c</CardContent>
      </Card>
      <Item variant="ghost" size="md" title="Pedido" />
      <Item variant="soft" title="Cliente" />
      <Item variant="outline" size="sm" title="Nota" />
      <Marker kind="inline">Buscando…</Marker>
      <Marker kind="separator">Hoje</Marker>
      <FileInput layout="dropzone" label="Comprovante" />
      <FileInput layout={layout} label="Anexo" />
      <Stat label="Receita" value="R$ 10" tone="success" />
      <Stat label="Faltou" value="2" tone="danger" />
      <Stat label="Pedidos" value="3" tone="neutral" />
      <Stat label="Estoque" value="7" tone="warning" />
      <Stat label="Zerados" value="0" muted />
      <Sidebar>
        <SidebarItem icon={<Home />} href="/" current>
          Painel
        </SidebarItem>
      </Sidebar>
      <FilterChip pressed={on} onPressedChange={set}>
        Todos
      </FilterChip>
      <FilterChip defaultPressed>Entradas</FilterChip>
      <Bubble variant="fill" align="end">Oi</Bubble>
      <Bubble variant="soft">Olá</Bubble>
      <Bubble variant="soft" tone="action">Posso ajudar?</Bubble>
      <Bubble variant="outline">Sobre a cor</Bubble>
      <Bubble variant="ghost">Uma resposta longa.</Bubble>
      <Bubble variant="soft" tone="danger" align="end">Não enviada</Bubble>
      <Bubble typing />
      <Badge tone="accent" variant="soft">Destaque</Badge>
      <Badge tone="action" variant="soft">Nova</Badge>
      <RowActions
        primaryLabel="Ver"
        items={[
          { label: 'Editar', tone: 'neutral', onClick: () => {} },
          { label: 'Excluir', tone: "danger", onClick: () => {} },
          { label: 'Duplicar', onClick: () => {} },
        ]}
      />
    </>
  );
}
