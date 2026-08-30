import type { ReactNode } from 'react';

export type SummaryBarTone = 'default' | 'positive' | 'negative' | 'warning' | 'muted';

export interface SummaryBarItem {
  /** Short label, e.g. "Valor em estoque" */
  label: string;
  /** Pre-formatted value (currency, count, etc.) — formatting is the consumer's job */
  value: string;
  /** Tints the value. Counters use warning/negative; money uses default/positive. */
  tone?: SummaryBarTone;
  /** Optional leading icon shown before the value */
  icon?: ReactNode;
}

export interface SummaryBarProps {
  items: SummaryBarItem[];
  className?: string;
}

const TONE_CLASS: Record<SummaryBarTone, string> = {
  default:  '[color:var(--summary-bar-value)]',
  positive: '[color:var(--summary-bar-value-positive)]',
  negative: '[color:var(--summary-bar-value-negative)]',
  warning:  '[color:var(--summary-bar-value-warning)]',
  muted:    '[color:var(--summary-bar-value-muted)]',
};

/**
 * Strip of aggregated metrics shown above a list (stock summary, finance totals,
 * report KPIs). Mobile: grid 2-colunas (não estoura nem esconde scroll). sm+: linha
 * flex com scroll horizontal se precisar. Contagem ímpar → último item ocupa a linha
 * inteira no mobile (sem célula vazia). Valores são pré-formatados pelo consumidor.
 *
 * Truque do divisor: no mobile, o fundo do CONTAINER é a cor do divisor e o gap-px
 * revela essa cor entre as células (cada célula tem o fundo normal) → linhas de grade
 * limpas. No sm+, o fundo volta ao normal e os divisores são border-left por item.
 */
export function SummaryBar({ items, className }: SummaryBarProps) {
  const odd = items.length % 2 === 1;
  return (
    <div
      className={[
        'grid grid-cols-2 gap-px overflow-hidden rounded-(--radius-card) border',
        'sm:flex sm:gap-0 sm:overflow-x-auto sm:[scrollbar-width:none]',
        '[background:var(--summary-bar-divider)] sm:[background:var(--summary-bar-bg)]',
        '[border-color:var(--summary-bar-border)]',
        className ?? '',
      ].join(' ')}
    >
      {items.map((item, i) => {
        const spanFull = odd && i === items.length - 1;
        return (
          <div
            key={i}
            className={[
              'flex flex-1 flex-col gap-1.5 px-4 py-3 [background:var(--summary-bar-bg)]',
              'min-w-0 sm:min-w-[7.5rem] sm:whitespace-nowrap',
              spanFull ? 'col-span-2 sm:col-span-1' : '',
              i > 0 ? 'sm:[border-left:1px_solid_var(--summary-bar-divider)]' : '',
            ].join(' ')}
          >
            <span className="text-[11px] font-medium uppercase tracking-wide [color:var(--summary-bar-label)]">
              {item.label}
            </span>
            <span
              className={[
                'flex items-center gap-1.5 text-heading-sm font-semibold leading-none tabular-nums',
                TONE_CLASS[item.tone ?? 'default'],
              ].join(' ')}
            >
              {item.icon}
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
