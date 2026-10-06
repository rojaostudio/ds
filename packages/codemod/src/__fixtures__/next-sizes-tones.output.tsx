import {
  Avatar,
  AvatarGroup,
  Breadcrumb,
  ContextMenuItem,
  Dialog,
  DropdownMenuItem,
  Heading,
  PageShell,
  Progress,
  Spinner,
  StarRating,
  Status,
  Tile,
} from '@rojaostudio/ds/components';
import { Info } from 'lucide-react';

export function Sizes({ open, size }: { open: boolean; size: 'sm' | 'lg' }) {
  return (
    <>
      <AvatarGroup aria-label="Equipe" size="md">
        <Avatar name="Ana Lima" size="md" />
        <Avatar name="Bia" size="sm" />
      </AvatarGroup>
      <Tile icon={<Info />} size="md" />
      <Tile icon={<Info />} size={size} />
      <PageShell maxWidth="narrow">x</PageShell>
      <Status size="md">Ativo</Status>
      <StarRating value={4} size="md" />
      <Dialog open={open} title="Plano" size="md" />
      <Progress value={40} label="Envio" size="md" />
      <Spinner size="md" tone="neutral" />
      <Spinner size="lg" tone="inverse" />
      <Breadcrumb items={[{ label: 'Início', href: '/' }]} tone="neutral" />
      <Heading tone="neutral">Pedidos</Heading>
      <DropdownMenuItem tone="neutral">Duplicar</DropdownMenuItem>
      <ContextMenuItem tone="neutral">Copiar</ContextMenuItem>
    </>
  );
}
