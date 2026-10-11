'use client';

import { createContext, useContext, useId, type HTMLAttributes, type ReactNode } from 'react';

/** The emphasis (Figma: `variant`); row is the dense list's line. */
export type ItemVariant = 'ghost' | 'outline' | 'soft' | 'row';
export type ItemSize = 'md' | 'sm';

export interface ItemProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'onSelect'> {
  /** The thing's name (Figma: `title`). */
  title: ReactNode;
  /** One supporting line (Figma: `showDescription` + `description`). */
  description?: ReactNode;
  /** A Tile for a thing, an Avatar for a person (Figma: `showMedia` + `media`). */
  media?: ReactNode;
  /**
   * The row's meta, between the text and the action (Figma: `showTrailing` + `trailing`): a sm Status or Badge
   * (e.g. a warning Status "Revisar") or a value. A state goes here, not at the end of the description.
   */
  trailing?: ReactNode;
  /** One action or control on the right (Figma: `showAction` + `action`): a ghost Button, an IconButton, a Switch. */
  action?: ReactNode;
  /**
   * ghost (default): loose in the list, a line between rows; outline: each row a block; soft: a background, no
   * border; row: the dense list (dozens of rows in a side panel or a customer search), no corners, only the line
   * below, 8 16 (sm) or 12 16 (md), the media in a box of 32 or 48 (a sm or md Tile, a md Avatar), title and
   * description on one line each with an ellipsis, a value in `trailing` (Figma: `variant`).
   */
  variant?: ItemVariant;
  /** md (default) or sm for dense lists: 14 and 12 text, 8 12 padding (8 16 in a row) (Figma: `size`). */
  size?: ItemSize;
  /**
   * The row is the chosen one (Figma: `selected`), in any variant: item/selected/background and a 3px band on the
   * start edge in item/selected/indicator. With `onSelect` it is also said, as aria-pressed.
   */
  selected?: boolean;
  /**
   * row only (Figma: `showDivider`, on by default): the line below. Off on the last row of a list, where the card's
   * border closes it; inside an ItemGroup the last row already goes without it.
   */
  showDivider?: boolean;
  /**
   * Makes the row pressable: the title becomes a button whose hit area covers the whole row (described by the
   * description); the `action` stays a separate control beside it. With `selected` the button carries aria-pressed.
   */
  onSelect?: () => void;
}

const InGroup = createContext(false);

/**
 * Item — Figma [RDS] Content/Item. One row of a list: media, title, description and one action, with an optional meta
 * (trailing) before it. Inside an ItemGroup it is a list item (<li>); alone, a <div>. Styles: item.css.
 *
 * A row to choose from (`onSelect` with `selected`): the title is a <button aria-pressed>, its hit area stretched over
 * the whole row, and the focus ring is drawn around the row. aria-pressed and not listbox/option, because each row
 * stays a plain button in the tab order inside a plain list (the list and its size are still announced), the row
 * keeps its own `action` (an option can't hold another control), and no roving focus is needed: a screen reader
 * hears "Ana Lima, toggle button, pressed". Pressing one row and unpressing the others is the consumer's state, as
 * with the FilterChip.
 */
export function Item({
  title,
  description,
  media,
  trailing,
  action,
  variant = 'ghost',
  size = 'md',
  selected,
  showDivider = true,
  onSelect,
  className,
  ...rest
}: ItemProps) {
  const Root = useContext(InGroup) ? 'li' : 'div';
  const descriptionId = useId();
  const pressable = Boolean(onSelect);
  return (
    <Root
      {...rest}
      className={[
        'rds-item',
        `rds-item--${variant}`,
        size === 'sm' && 'rds-item--sm',
        selected && 'rds-item--selected',
        !showDivider && 'rds-item--no-divider',
        pressable && 'rds-item--pressable',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {media && <span className="rds-item__media">{media}</span>}
      <span className="rds-item__content">
        {pressable ? (
          <button
            type="button"
            className="rds-item__title rds-item__press"
            aria-pressed={selected}
            aria-describedby={description ? descriptionId : undefined}
            onClick={onSelect}
          >
            {title}
          </button>
        ) : (
          <span className="rds-item__title">{title}</span>
        )}
        {description && (
          <span id={descriptionId} className="rds-item__description">
            {description}
          </span>
        )}
      </span>
      {trailing && <span className="rds-item__trailing">{trailing}</span>}
      {action && <span className="rds-item__action">{action}</span>}
    </Root>
  );
}

export interface ItemGroupProps extends HTMLAttributes<HTMLUListElement> {
  /** The Items. One variant for the whole list. */
  children: ReactNode;
}

/**
 * The list the Items go in (<ul>). ghost rows get a line between them, row rows a line below each but the last (the
 * card's border closes the list); outline and soft rows a gap of 8.
 */
export function ItemGroup({ className, children, ...rest }: ItemGroupProps) {
  return (
    <InGroup.Provider value={true}>
      <ul {...rest} className={['rds-item-group', className].filter(Boolean).join(' ')}>
        {children}
      </ul>
    </InGroup.Provider>
  );
}
