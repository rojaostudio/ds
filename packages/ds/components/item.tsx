'use client';

import { createContext, useContext, type HTMLAttributes, type ReactNode } from 'react';

/** The emphasis (Figma: `variant`). */
export type ItemVariant = 'ghost' | 'outline' | 'soft';
export type ItemSize = 'md' | 'sm';

/** 2.0.0-next names, deprecated: default → ghost, muted → soft. */
const LEGACY_VARIANT: Record<string, ItemVariant> = { default: 'ghost', muted: 'soft' };

export interface ItemProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The thing's name (Figma: `title`). */
  title: ReactNode;
  /** One supporting line (Figma: `showDescription` + `description`). */
  description?: ReactNode;
  /** A Tile for a thing, an Avatar for a person (Figma: `showMedia` + `media`). */
  media?: ReactNode;
  /** One action or control on the right (Figma: `showAction` + `action`): a ghost Button, an IconButton, a Switch. */
  action?: ReactNode;
  /**
   * ghost (default): loose in the list, a line between rows; outline: each row a block; soft: a background, no
   * border (Figma: `variant`). `'default'` and `'muted'` are deprecated (2.0.0-next): they are ghost and soft.
   */
  variant?: ItemVariant | 'default' | 'muted';
  /**
   * md (default) or sm for dense lists: 14 and 12 text, 8 12 padding (Figma: `size`). `'default'` is deprecated
   * (2.0.0-next): it is `'md'`.
   */
  size?: ItemSize | 'default';
}

const InGroup = createContext(false);

/**
 * Item — Figma [RDS] Content/Item. One row of a list: media, title, description and one action. Inside an ItemGroup
 * it is a list item (<li>); alone, a <div>. Styles: item.css.
 */
export function Item({ title, description, media, action, variant = 'ghost', size = 'md', className, ...rest }: ItemProps) {
  const Root = useContext(InGroup) ? 'li' : 'div';
  const look = LEGACY_VARIANT[variant] ?? variant;
  return (
    <Root
      {...rest}
      className={['rds-item', `rds-item--${look}`, size === 'sm' && 'rds-item--sm', className].filter(Boolean).join(' ')}
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

/** The list the Items go in (<ul>). ghost rows get a line between them; outline and soft rows a gap of 8. */
export function ItemGroup({ className, children, ...rest }: ItemGroupProps) {
  return (
    <InGroup.Provider value={true}>
      <ul {...rest} className={['rds-item-group', className].filter(Boolean).join(' ')}>
        {children}
      </ul>
    </InGroup.Provider>
  );
}
