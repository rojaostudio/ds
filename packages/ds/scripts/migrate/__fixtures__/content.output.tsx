import { Card, CardHeader, CardContent, Avatar, AvatarGroup, Skeleton, Chip, Popover, Breadcrumb } from '@rojaostudio/ds/components';
import { Tag, ChevronDown } from 'lucide-react';

export function Content({ remove }: { remove: () => void }) {
  return (
    <Card>
      <CardHeader title="Equipe" />
      <CardContent className="space-y-3">
        <AvatarGroup aria-label="Equipe" size="lg">
          <Avatar name="Ana Lima" size="lg" />
          <Avatar name="Bia" size="sm" />
          <Avatar name="Caio" size="lg" />
        </AvatarGroup>
        <Skeleton />
        <Skeleton shape="circle" width={40} height={40} />
        <Skeleton shape="rect" height={128} className="mt-2" />
        <Chip icon={<Tag />} onRemove={remove}>
          Promo
        </Chip>
        <Popover trigger={<button type="button">Abrir <ChevronDown /></button>} side="top" align="end">
          <p>Detalhe</p>
        </Popover>
        <Breadcrumb items={[{ label: 'Início', href: '/' }]} />
      </CardContent>
    </Card>
  );
}
