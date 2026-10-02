import { Card, CardHeader, CardBody, Avatar, AvatarGroup, Skeleton, Chip, Popover, Breadcrumb } from '@rojaostudio/ds/components';
import { Tag, ChevronDown } from 'lucide-react';

export function Content({ remove }: { remove: () => void }) {
  return (
    <Card>
      <CardHeader title="Equipe" />
      <CardBody className="space-y-3">
        <AvatarGroup aria-label="Equipe" spacing="tight">
          <Avatar name="Ana Lima" />
          <Avatar name="Bia" size="xs" />
          <Avatar name="Caio" size="md" />
        </AvatarGroup>
        <Skeleton variant="text" />
        <Skeleton variant="avatar" />
        <Skeleton variant="card" className="mt-2" />
        <Chip leading={<Tag />} onRemove={remove} subtle>
          Promo
        </Chip>
        <Popover trigger={<button type="button">Abrir <ChevronDown /></button>} placement="top-end" offset={8}>
          <p>Detalhe</p>
        </Popover>
        <Breadcrumb items={[{ label: 'Início', href: '/' }]} separator="/" />
      </CardBody>
    </Card>
  );
}
