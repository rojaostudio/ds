'use client';

import Link from 'next/link';

// ── Tokens (via CSS vars — source: base.css → filter-chip/*) ─────────────────
const BASE =
  'h-control-sm inline-flex items-center text-caption font-medium border transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus ' +
  'px-[var(--filter-chip-padding-x)] ' +
  '[border-radius:var(--filter-chip-radius)]';

const ACTIVE =
  '[background:var(--filter-chip-color-surface-active)] ' +
  '[border-color:var(--filter-chip-color-stroke-active)] ' +
  '[color:var(--filter-chip-color-text-active)]';

const INACTIVE =
  '[background:var(--filter-chip-color-surface-inactive)] ' +
  '[border-color:var(--filter-chip-color-stroke-inactive)] ' +
  '[color:var(--filter-chip-color-text-inactive)] ' +
  'hover:[background:var(--filter-chip-color-surface-hover)] ' +
  'hover:[border-color:var(--filter-chip-color-stroke-hover)] ' +
  'hover:[color:var(--filter-chip-color-text-hover)]';

const DISABLED =
  '[background:var(--filter-chip-color-surface-disabled)] ' +
  '[border-color:var(--filter-chip-color-stroke-disabled)] ' +
  '[color:var(--filter-chip-color-text-disabled)] ' +
  'opacity-50 pointer-events-none cursor-not-allowed';

// ── FilterChip — atom ─────────────────────────────────────────────────────────
interface FilterChipBaseProps {
  label:      string;
  active:     boolean;
  count?:     number;
  disabled?:  boolean;
  className?: string;
}

interface FilterChipLinkProps extends FilterChipBaseProps {
  href:     string;
  onClick?: never;
}

interface FilterChipButtonProps extends FilterChipBaseProps {
  onClick:  () => void;
  href?:    never;
}

export type FilterChipProps = FilterChipLinkProps | FilterChipButtonProps;

function FilterChipBody({ label, count }: { label: string; count?: number }) {
  if (count === undefined) return <>{label}</>;
  return (
    <>
      {label}
      <span className="ml-1 opacity-60 tabular-nums">{count}</span>
    </>
  );
}

export function FilterChip({ label, active, count, disabled = false, href, onClick, className = '' }: FilterChipProps) {
  const cls = [BASE, active ? ACTIVE : INACTIVE, disabled ? DISABLED : '', className].filter(Boolean).join(' ');

  if (href) {
    return (
      <Link
        href={href}
        aria-current={active ? 'true' : undefined}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        className={cls}
      >
        <FilterChipBody label={label} count={count} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      className={cls}
    >
      <FilterChipBody label={label} count={count} />
    </button>
  );
}

// ── FilterChipGroup — pattern (composição) ────────────────────────────────────
export type FilterChipItem = {
  label:     string;
  value:     string | undefined;
  count?:    number;
  href?:     string;
  onClick?:  () => void;
  disabled?: boolean;
};

export interface FilterChipGroupProps {
  items:      FilterChipItem[];
  active:     string | undefined;
  label:      string;   // aria-label do grupo — obrigatório quando há múltiplos grupos na página
  className?: string;
}

/**
 * FilterChipGroup — barra de filtro com pills.
 *
 * Regra: ≤ 5 opções. Mais que isso → usar Select.
 * Renderiza como links (href) para preservar URL e back/forward,
 * ou como buttons (onClick) para filtro client-side.
 *
 * @example
 * <FilterChipGroup
 *   label="Filtrar por tipo"
 *   items={[
 *     { label: 'Todos',    value: undefined, href: '/stock' },
 *     { label: 'Entradas', value: 'in',      href: '/stock?filter=in' },
 *     { label: 'Saídas',   value: 'out',     href: '/stock?filter=out' },
 *   ]}
 *   active={searchParams.filter}
 * />
 */
export function FilterChipGroup({ items, active, label, className = '' }: FilterChipGroupProps) {
  return (
    <div role="group" aria-label={label} className={['flex flex-wrap [gap:var(--filter-chip-group-gap)]', className].filter(Boolean).join(' ')}>
      {items.map((item) => {
        if (process.env.NODE_ENV === 'development' && !item.href && !item.onClick) {
          console.warn(`[FilterChipGroup] item "${item.label}" has neither href nor onClick — click will have no effect`);
        }
        const isActive = active === item.value || (!active && item.value === undefined);
        if (item.href) {
          return (
            <FilterChip key={item.label} label={item.label} active={isActive} count={item.count} disabled={item.disabled} href={item.href} />
          );
        }
        return (
          <FilterChip
            key={item.label}
            label={item.label}
            active={isActive}
            count={item.count}
            disabled={item.disabled}
            onClick={item.onClick ?? (() => {})}
          />
        );
      })}
    </div>
  );
}
