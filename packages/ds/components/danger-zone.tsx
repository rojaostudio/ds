import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from './card';
import { TriangleAlertIcon } from './internal/icons';
import { Item } from './item';
import { Tile } from './tile';

export interface DangerZoneProps {
  /** The zone's title (the CardHeader's, an h2), such as "Zona de risco". */
  title?: string;
  /** One line under the title. */
  description?: string;
  /** The DangerZoneItems. */
  children: ReactNode;
  className?: string;
}

/**
 * DangerZone — a composition of the Card, its CardHeader with a danger Tile, and Items (Figma [RDS] Content): the
 * irreversible actions of a settings page (delete the account, unpublish). The title stays neutral; the Tile and
 * each item's danger Button say the risk. Styles: danger-zone.css.
 */
export function DangerZone({ title, description, children, className }: DangerZoneProps) {
  return (
    <Card as={title ? 'section' : 'div'} className={['rds-danger-zone', className].filter(Boolean).join(' ')}>
      {title && (
        <CardHeader
          titleAs="h2"
          icon={<Tile icon={<TriangleAlertIcon />} tone="danger" variant="soft" />}
          title={title}
          description={description}
        />
      )}
      <CardContent className="rds-danger-zone__items">{children}</CardContent>
    </Card>
  );
}

export interface DangerZoneItemProps {
  title: ReactNode;
  description?: ReactNode;
  /** The action on the right: a Button tone="danger" variant="outline". */
  action?: ReactNode;
  className?: string;
}

/** One irreversible action: an Item with its title, what it does and the danger Button. */
export function DangerZoneItem({ title, description, action, className }: DangerZoneItemProps) {
  return <Item className={['rds-danger-zone__item', className].filter(Boolean).join(' ')} title={title} description={description} action={action} />;
}
