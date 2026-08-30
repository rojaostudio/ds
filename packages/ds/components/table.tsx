

type Align = 'left' | 'right' | 'center';
const ALIGN: Record<Align, string> = { left: 'text-left', right: 'text-right', center: 'text-center' };

export function Table({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <table className={['w-full text-label', className].join(' ')} {...props}>
      {children}
    </table>
  );
}

export function TableHead({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={className || undefined} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={['divide-y divide-stroke-default', className].join(' ')} {...props}>
      {children}
    </tbody>
  );
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  header?: boolean;
  noHover?: boolean;
}

export function TableRow({ header, noHover, className = '', children, onClick, ...props }: TableRowProps) {
  const base = header
    ? 'border-b border-stroke-default'
    : [
        !noHover && 'hover:bg-surface-raised transition-colors',
        onClick && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus',
      ].filter(Boolean).join(' ');

  const interactiveProps = !header && onClick
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent<HTMLTableRowElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(e as unknown as React.MouseEvent<HTMLTableRowElement>);
          }
        },
      }
    : {};

  return (
    <tr
      className={[base, className].filter(Boolean).join(' ')}
      onClick={onClick}
      {...interactiveProps}
      {...props}
    >
      {children}
    </tr>
  );
}

export interface ThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: Align;
}

export function Th({ align = 'left', className = '', children, ...props }: ThProps) {
  return (
    <th
      className={[
        'px-5 py-3 text-caption font-semibold text-fg-muted uppercase tracking-wide whitespace-nowrap',
        ALIGN[align],
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </th>
  );
}

export interface TdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: Align;
  muted?: boolean;
  bold?: boolean;
}

export function Td({ align = 'left', muted, bold, className = '', children, ...props }: TdProps) {
  return (
    <td
      className={[
        'px-5 py-3',
        ALIGN[align],
        muted ? 'text-fg-muted' : 'text-fg-primary',
        bold ? 'font-medium' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </td>
  );
}
