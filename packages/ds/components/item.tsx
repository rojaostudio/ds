'use client';

import { createContext, useContext, type HTMLAttributes, type ReactNode } from 'react';

export type ItemVariant = 'default' | 'outline' | 'muted';
export type ItemSize = 'default' | 'sm';

export interface ItemProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The thing's name (Figma: `title`). */
  title: ReactNode;
  /** One supporting line (Figma: `showDescription` + `description`). */
  description?: ReactNode;
  /** A Tile for a thing, an Avatar for a person (Figma: `showMedia` + `media`). */
  media?: ReactNode;
  /** One action or control on the right (Figma: `showAction` + `action`): a ghost Button, an IconButton, a Switch. */
  action?: ReactNode;
  /** default: loose in the list, a line between rows; outline: each row a block; muted: a background, no border. */
  variant?: ItemVariant;
  /** sm for dense lists: 14 and 12 text, 8 12 padding. */
  size?: ItemSize;
}

const InGroup = createContext(false);

/**
 * Item — Figma [RDS] Content/Item. One row of a list: media, title, description and one action. Inside an ItemGroup
 * it is a list item (<li>); alone, a <div>. Styles: item.css.
 */
export function Item({ title, description, media, action, variant = 'default', size = 'default', className, ...rest }: ItemProps) {
  const Root = useContext(InGroup) ? 'li' : 'div';
  return (
    <Root
      {...rest}
      className={['rds-item', `rds-item--${variant}`, size === 'sm' && 'rds-item--sm', className].filter(Boolean).join(' ')}
    >
      {media && <span className="rds-item__media">{media}</span>}
      <span className="rds-item__content">
        <span className="rds-item__title">{title}</span>
        {description && <span className="rds-item__description">{description}</span>}
      </span>
      {action && <span className="rds-item__action">{action}</span>}
    </Root>
  );
}

export interface ItemGroupProps extends HTMLAttributes<HTMLUListElement> {
  /** The Items. One variant for the whole list. */
  children: ReactNode;
}

/** The list the Items go in (<ul>). default rows get a line between them; outline and muted rows a gap of 8. */
export function ItemGroup({ className, children, ...rest }: ItemGroupProps) {
  return (
    <InGroup.Provider value={true}>
      <ul {...rest} className={['rds-item-group', className].filter(Boolean).join(' ')}>
        {children}
      </ul>
    </InGroup.Provider>
  );
}
