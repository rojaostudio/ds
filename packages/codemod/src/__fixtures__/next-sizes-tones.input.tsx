import {
  Avatar,
  AvatarGroup,
  Breadcrumb,
  ContextMenuItem,
  Dialog,
  DropdownMenuItem,
  Heading,
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
      <AvatarGroup aria-label="Equipe" size="default">
        <Avatar name="Ana Lima" size="default" />
        <Avatar name="Bia" size="sm" />
      </AvatarGroup>
      <Tile icon={<Info />} size="default" />
      <Tile icon={<Info />} size={size} />
      <Status size="default">Ativo</Status>
      <StarRating value={4} size="default" />
      <Dialog open={open} title="Plano" size="default" />
      <Progress value={40} label="Envio" size="default" />
      <Spinner size="default" tone="default" />
      <Spinner size="lg" tone="inverse" />
      <Breadcrumb items={[{ label: 'Início', href: '/' }]} tone="default" />
      <Heading tone="default">Pedidos</Heading>
      <DropdownMenuItem tone="default">Duplicar</DropdownMenuItem>
      <ContextMenuItem tone="default">Copiar</ContextMenuItem>
    </>
  );
}
