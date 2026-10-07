'use client';

import { useId, type HTMLAttributes, type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from 'react';
import { Empty } from './empty';
import { Skeleton } from './skeleton';
import { AlertIcon, ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, SearchXIcon, TableIcon } from './internal/icons';

export type TableAlign = 'start' | 'end';
export type TableSort = 'ascending' | 'descending' | 'none';
/** The data's life cycle (Figma: `status`). */
export type TableStatus = 'default' | 'loading' | 'empty' | 'noResults' | 'error';

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** What the table shows. Required: it names the table (and its scroll area) for screen readers. */
  caption: ReactNode;
  /** Show the caption on screen. By default it is only for screen readers. */
  showCaption?: boolean;
  /** TableHeader, TableBody and, for totals, TableFooter (Figma: the `rows` slot). */
  children: ReactNode;
  /** loading marks the table busy. Outside default, put a TableStatus in the body. */
  status?: TableStatus;
}

/**
 * Table — Figma [RDS] Content/Table. Data to compare across rows: text on the left, numbers on the right. On a narrow
 * screen it scrolls sideways inside its border (a focusable, named region). Styles: table.css.
 */
export function Table({ caption, showCaption, status = 'default', className, children, ...rest }: TableProps) {
  const captionId = useId();
  return (
    <div className={['rds-table', className].filter(Boolean).join(' ')} role="region" aria-labelledby={captionId} tabIndex={0}>
      <table {...rest} className="rds-table__table" aria-busy={status === 'loading' || undefined}>
        <caption id={captionId} className={showCaption ? 'rds-table__caption' : 'rds-visually-hidden'}>
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

export function TableHeader(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />;
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

/**
 * The totals row at the end (Figma: .table/cell type=footer): one row, the label in a `TableHead scope="row"`
 * ("Total"), the sums in `TableCell align="end"` (tabular). Panel fill, a line above, the text stronger than the body.
 * With pagination, say what it totals ("Total da página").
 */
export function TableFooter({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot {...rest} className={['rds-table__foot', className].filter(Boolean).join(' ')} />;
}

export function TableRow(props: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} />;
}

export interface TableHeadProps extends Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
  /** start for text columns, end for number columns. Same as the column's cells. */
  align?: TableAlign;
  /** A column that sorts: its current order. The header becomes a button, and aria-sort says the order. */
  sort?: TableSort;
  /** Called when the person asks to sort by this column. Required with `sort`. */
  onSort?: () => void;
}

/** A column header (Figma: .table/cell type=header). */
export function TableHead({ align = 'start', sort, onSort, className, children, ...rest }: TableHeadProps) {
  const SortIcon = sort === 'ascending' ? ArrowUpIcon : sort === 'descending' ? ArrowDownIcon : ArrowUpDownIcon;
  return (
    <th
      scope="col"
      aria-sort={sort}
      {...rest}
      className={['rds-table__head', `rds-table__cell--${align}`, className].filter(Boolean).join(' ')}
    >
      {sort ? (
        <button type="button" className="rds-table__sort" onClick={onSort}>
          {children}
          <span className="rds-table__sort-icon" aria-hidden="true">
            <SortIcon />
          </span>
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export interface TableCellProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
  /** start for text, end for numbers (tabular figures). */
  align?: TableAlign;
  /** body for text; slot when the cell holds a component (Status, Badge, Avatar, Button): less padding. */
  type?: 'body' | 'slot';
}

/** A body cell (Figma: .table/cell type=body or slot). */
export function TableCell({ align = 'start', type = 'body', className, ...rest }: TableCellProps) {
  return (
    <td
      {...rest}
      className={['rds-table__cell', `rds-table__cell--${align}`, type === 'slot' && 'rds-table__cell--slot', className]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

const STATUS_COPY = {
  empty: { icon: <TableIcon />, title: 'Nada por aqui ainda', description: 'Quando houver dados, eles aparecem nesta tabela.' },
  noResults: { icon: <SearchXIcon />, title: 'Nada encontrado', description: 'Tente outro termo ou limpe a busca.' },
  error: { icon: <AlertIcon />, title: 'Não deu para carregar', description: 'Verifique a conexão e tente de novo.' },
} as const;

export interface TableStatusProps {
  /** loading: 3 rows of Skeleton; empty, noResults and error: an Empty across the columns. */
  status: Exclude<TableStatus, 'default'>;
  /** How many columns the table has, so the state spans all of them. */
  columns: number;
  /** Which columns hold numbers (aligned to the end), for the loading rows. */
  numericColumns?: number[];
  /** The Empty's title, in the words of the screen ("Nenhum pedido ainda"). */
  title?: ReactNode;
  description?: ReactNode;
  /** The Empty title's level, one below the page's last heading. */
  titleAs?: 'h2' | 'h3' | 'h4';
  /** The way out, an outline Button: create, clear the search, try again. */
  action?: ReactNode;
}

/** The table's body when there is no data to show yet: loading, empty, no results or error. Inside TableBody. */
export function TableStatus({ status, columns, numericColumns = [], title, titleAs, description, action }: TableStatusProps) {
  if (status === 'loading') {
    return (
      <>
        {[0, 1, 2].map((row) => (
          <tr key={row}>
            {Array.from({ length: columns }, (_, col) => (
              <TableCell key={col} type="slot" align={numericColumns.includes(col) ? 'end' : 'start'}>
                <Skeleton width={numericColumns.includes(col) ? 48 : '70%'} />
              </TableCell>
            ))}
          </tr>
        ))}
      </>
    );
  }
  const copy = STATUS_COPY[status];
  return (
    <tr>
      <td className="rds-table__status" colSpan={columns}>
        <Empty
          icon={copy.icon}
          tone={status === 'error' ? 'danger' : 'neutral'}
          title={title ?? copy.title}
          titleAs={titleAs}
          description={description ?? copy.description}
          action={action}
          role={status === 'error' ? 'alert' : undefined}
        />
      </td>
    </tr>
  );
}
