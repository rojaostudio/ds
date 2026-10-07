import type { HTMLAttributes, ReactNode } from 'react';

/** stacked: the label above the value (the default, and the one for the grid); inline: the label on the left. */
export type DescriptionListLayout = 'stacked' | 'inline';
/** md for a screen; sm for a printed sheet (12/16). */
export type DescriptionListDensity = 'md' | 'sm';
/** 1: one pair per line; auto: columns of at least 300 that wrap (1 on a phone, 2 in a card). */
export type DescriptionListColumns = 1 | 'auto';

export interface DescriptionListProps extends HTMLAttributes<HTMLDListElement> {
  /** The DescriptionItems (Figma: the `items` slot). */
  children: ReactNode;
  /** Figma .description-list/item `layout`. Inline turns stacked on a compact screen (below 1024). */
  layout?: DescriptionListLayout;
  /** Figma .description-list/item `density`. */
  density?: DescriptionListDensity;
  /** Figma `arrangement`: 1 is list, auto is grid. */
  columns?: DescriptionListColumns;
}

/**
 * DescriptionList — Figma [RDS] Content/DescriptionList. Label → value pairs for a record's detail, a form's
 * summary or a printed document (Cliente, Entrega, Quantidade): a <dl>, each pair a <div> with its <dt> and <dd>, so
 * a screen reader reads them together. Every pair of a list has the same layout and density. Not across the whole
 * screen: in a card or a content column. Styles: description-list.css.
 */
export function DescriptionList({
  layout = 'stacked',
  density = 'md',
  columns = 1,
  className,
  children,
  ...rest
}: DescriptionListProps) {
  return (
    <dl
      {...rest}
      className={[
        'rds-description-list',
        `rds-description-list--${layout}`,
        `rds-description-list--${density}`,
        columns === 'auto' && 'rds-description-list--grid',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </dl>
  );
}

export interface DescriptionItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The label (Figma: `label`), a few words: "Cliente", "Entrega". */
  label: ReactNode;
  /** The value: text (Figma: `value`) or a component, a Status, a Badge, a link (Figma: `valueSlot`). */
  children: ReactNode;
}

/** One pair (Figma .description-list/item): the <dt> and the <dd>. */
export function DescriptionItem({ label, children, className, ...rest }: DescriptionItemProps) {
  return (
    <div {...rest} className={['rds-description-list__item', className].filter(Boolean).join(' ')}>
      <dt className="rds-description-list__label">{label}</dt>
      <dd className="rds-description-list__value">{children}</dd>
    </div>
  );
}
