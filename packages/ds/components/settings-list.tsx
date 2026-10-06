import type { ReactNode } from 'react';
import { Card } from './card';
import { PageHeader } from './page-header';

export interface SettingsListProps {
  /** The group's title (an h2). Leave it out when the group has no header. */
  title?: string;
  description?: string;
  /** One action on the right of the title (the PageHeader's actions). */
  action?: ReactNode;
  /** A Card around the rows. Default true; false leaves the rows loose. */
  framed?: boolean;
  /** The rows: Items. */
  children: ReactNode;
  className?: string;
}

/**
 * SettingsList — a composition of the PageHeader (h2), the Card and the Items (Figma [RDS] Content/Item): a group
 * of settings, one per row, a line between rows. Settings are parallel, so the title has no number. Styles:
 * settings-list.css.
 */
export function SettingsList({ title, description, action, framed = true, children, className }: SettingsListProps) {
  const rows = <div className="rds-settings-list__rows">{children}</div>;
  return (
    <section className={['rds-settings-list', className].filter(Boolean).join(' ')}>
      {title && <PageHeader titleAs="h2" title={title} description={description} actions={action} />}
      {framed ? (
        <Card as="div" className="rds-settings-list__frame">
          {rows}
        </Card>
      ) : (
        rows
      )}
    </section>
  );
}
