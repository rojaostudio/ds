'use client';

import { useState } from 'react';
import { ChevronDown, ListFilter, SlidersHorizontal, X } from 'lucide-react';
import { FilterChip } from './filter-chip';
import { Search } from './search';
import { Divider } from './divider';
import { IconButton } from './icon-button';
import { Popover } from './popover';
import { BottomSheet } from './bottom-sheet';

export type DataTableHeaderSearch = {
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
};

export type DataTableFilterOption = {
  value: string;
  label: string;
  count?: number;
};

export type DataTableFilterDef = {
  key:      string;
  label:    string;
  value:    string;
  options:  DataTableFilterOption[];
  onChange: (v: string) => void;
};

export type DataTablePillDef = {
  key:     string;
  label:   string;
  active:  boolean;
  count?:  number;
  onClick: () => void;
};

export type DataTableHeaderProps = {
  search?:         DataTableHeaderSearch;
  filters?:        DataTableFilterDef[];
  pillFilters?:    DataTablePillDef[];
  onClear?:        () => void;
  actions?:        React.ReactNode;
  className?:      string;
  /** Em mobile, move filters + actions para um BottomSheet. pillFilters sempre visíveis. */
  mobileCollapse?: boolean;
};

const optCls = (selected: boolean) =>
  `w-full text-left text-label px-3 py-1.5 rounded-(--radius-card) transition-colors flex items-center justify-between gap-2 ${
    selected ? 'bg-brand-primary text-brand-on-primary' : 'text-fg-secondary hover:bg-surface-raised'
  }`;

// Triggers de filtro acompanham a altura da busca (h-control-md, 40px) —
// busca e filtros na mesma linha sempre alinham. Pills (FilterChip) seguem 32px.
function triggerCls(isActive: boolean) {
  const base = 'h-control-md flex items-center gap-1 px-3 text-label font-medium rounded-(--radius-control) border transition-colors';
  if (isActive) return `${base} border-brand-primary bg-brand-primary text-brand-on-primary`;
  return `${base} border-stroke-default bg-surface-default text-fg-muted hover:bg-surface-raised hover:border-stroke-strong`;
}

function getOptionLabel(filter: DataTableFilterDef) {
  if (filter.value === '') return filter.label;
  const opt = filter.options.find((o) => o.value === filter.value);
  return opt?.label ?? filter.label;
}

// ── Dropdown de um filtro (desktop inline e mobile com filtro único) ──────────

export function FilterDropdown({ f, placement = 'bottom-start' }: {
  f: DataTableFilterDef;
  placement?: 'bottom-start' | 'bottom-end';
}) {
  return (
    <Popover
      placement={placement}
      trigger={
        <button type="button" className={triggerCls(f.value !== '')}>
          {getOptionLabel(f)}
          <ChevronDown size={12} />
        </button>
      }
    >
      {({ close }) => (
        <div className="w-36 rounded-(--radius-card) border border-stroke-default bg-surface-default shadow-xl p-1 overflow-hidden">
          {f.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { f.onChange(opt.value); close(); }}
              className={optCls(f.value === opt.value)}
            >
              <span>{opt.label}</span>
              {opt.count != null && (
                <span className="text-[11px] font-semibold opacity-60 tabular-nums">
                  {opt.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

// ── Filtro único no mobile: trigger + BottomSheet com as opções abertas ───────
// Padrão do produto: select/combobox no mobile abre bottom sheet, nunca popover.

function MobileSingleFilter({ f }: { f: DataTableFilterDef }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={triggerCls(f.value !== '')} onClick={() => setOpen(true)}>
        {getOptionLabel(f)}
        <ChevronDown size={12} />
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={f.label}>
        <div className="flex flex-col gap-0.5">
          {f.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { f.onChange(opt.value); setOpen(false); }}
              className={optCls(f.value === opt.value)}
            >
              <span>{opt.label}</span>
              {opt.count != null && (
                <span className="text-[11px] font-semibold opacity-60 tabular-nums">
                  {opt.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

// ── Botão "Filtros" com badge de contagem (desktop colapsado + mobile) ────────

function FiltersButton({ count, onClick }: { count: number; onClick?: () => void }) {
  return (
    <button
      type="button"
      data-filter-toggle
      onClick={onClick}
      className={`h-control-md flex items-center gap-1.5 px-3 text-label border rounded-(--radius-control) transition-colors ${
        count > 0
          ? 'bg-brand-primary text-brand-on-primary border-brand-primary'
          : 'bg-surface-default text-fg-muted border-stroke-default hover:bg-surface-raised'
      }`}
    >
      <SlidersHorizontal size={14} />
      Filtros
      {count > 0 && (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface-default text-fg-primary text-[10px] font-bold">
          {count}
        </span>
      )}
    </button>
  );
}

// ── Grupos de filtros empilhados (popover desktop, popover/sheet mobile) ──────

function FilterGroups({
  filters,
  onPick,
  onClear,
  showClear,
}: {
  filters:   DataTableFilterDef[];
  onPick:    (f: DataTableFilterDef, value: string) => void;
  onClear?:  () => void;
  showClear: boolean;
}) {
  return (
    <div className="space-y-4">
      {filters.map((f) => (
        <div key={f.key}>
          <p className="text-[11px] font-semibold text-fg-disabled uppercase tracking-wide mb-2">
            {f.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {f.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onPick(f, opt.value)}
                className={optCls(f.value === opt.value)}
              >
                <span>{opt.label}</span>
                {opt.count != null && (
                  <span className="text-[11px] font-semibold opacity-60 tabular-nums">
                    {opt.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
      {onClear && showClear && (
        <button
          type="button"
          onClick={onClear}
          className="w-full text-center text-caption text-fg-disabled hover:text-fg-secondary underline underline-offset-2 pt-1"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

export function DataTableHeader({
  search,
  filters = [],
  pillFilters = [],
  onClear,
  actions,
  className = '',
  mobileCollapse = false,
}: DataTableHeaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeFilterCount =
    filters.filter((f) => f.value !== '').length +
    pillFilters.filter((p) => p.active).length;

  // Com 2+ filtros o desktop colapsa num botão "Filtros" (popover empilhado);
  // os ativos viram chips removíveis ao lado, mantendo o status visível.
  const collapseDesktop = filters.length >= 2;
  const activeFilters = filters.filter((f) => f.value !== '');
  // Regra "1 filtro = dropdown direto" vale também no mobile; o botão "Filtros"
  // com sheet/popover só aparece com 2+ filtros (ou quando há actions a colapsar).
  const singleFilter = filters.length === 1 ? filters[0] : null;

  return (
    <div className={['flex items-center gap-2 mb-3', className].filter(Boolean).join(' ')}>
      {/* Search */}
      {search && (
        <div className="flex-1 min-w-0">
          <Search
            size="md"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            onClear={() => search.onChange('')}
            placeholder={search.placeholder ?? 'Buscar...'}
          />
        </div>
      )}

      {/* Pills (always visible) */}
      {pillFilters.length > 0 && (
        <div data-pill-filter className="flex items-center [gap:var(--filter-chip-group-gap)] flex-wrap">
          {pillFilters.map((p) => (
            <FilterChip
              key={p.key}
              label={p.label}
              active={p.active}
              count={p.count}
              onClick={p.onClick}
            />
          ))}
        </div>
      )}

      {/* Desktop: 1 filtro = dropdown inline */}
      {filters.length > 0 && !collapseDesktop && (
        <div className="hidden md:flex items-center gap-1.5">
          {(search || pillFilters.length > 0) && (
            <Divider orientation="vertical" className="mx-0.5" />
          )}
          <ListFilter size={14} className="text-fg-disabled shrink-0" />
          {filters.map((f) => <FilterDropdown key={f.key} f={f} />)}
        </div>
      )}

      {/* Desktop: 2+ filtros = chips dos ativos + botão "Filtros" colapsado */}
      {collapseDesktop && (
        <div className="hidden md:flex items-center gap-1.5">
          {(search || pillFilters.length > 0) && (
            <Divider orientation="vertical" className="mx-0.5" />
          )}
          {activeFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => f.onChange('')}
              title={f.label}
              className={triggerCls(true)}
            >
              {getOptionLabel(f)}
              <X size={12} />
            </button>
          ))}
          <Popover placement="bottom-end" trigger={<FiltersButton count={activeFilterCount} />}>
            {({ close }) => (
              <div className="bg-surface-default border border-stroke-default rounded-(--radius-card) shadow-lg p-4 w-56 max-h-[70vh] overflow-y-auto">
                <FilterGroups
                  filters={filters}
                  onPick={(f, v) => { f.onChange(v); close(); }}
                  onClear={onClear ? () => { onClear(); close(); } : undefined}
                  showClear={activeFilterCount > 0}
                />
              </div>
            )}
          </Popover>
        </div>
      )}

      {/* Clear button (desktop inline — no modo colapsado o limpar vive no popover) */}
      {onClear && activeFilterCount > 0 && !collapseDesktop && (
        <IconButton
          icon={<X size={13} />}
          aria-label="Limpar filtros"
          size="sm"
          variant="ghost"
          color="neutral"
          className="hidden md:inline-flex"
          onClick={onClear}
        />
      )}

      {/* Mobile: filtro único = trigger que abre BottomSheet com as opções */}
      {singleFilter && !(mobileCollapse && actions) && (
        <div className="md:hidden">
          <MobileSingleFilter f={singleFilter} />
        </div>
      )}

      {/* Mobile: Popover padrão (mobileCollapse=false, 2+ filtros) */}
      {!mobileCollapse && filters.length >= 2 && (
        <div className="md:hidden">
          <Popover placement="bottom-end" trigger={<FiltersButton count={activeFilterCount} />}>
            {({ close }) => (
              <div className="bg-surface-default border border-stroke-default rounded-(--radius-card) shadow-lg p-4 w-52">
                <FilterGroups
                  filters={filters}
                  onPick={(f, v) => { f.onChange(v); close(); }}
                  onClear={onClear ? () => { onClear(); close(); } : undefined}
                  showClear={activeFilterCount > 0}
                />
              </div>
            )}
          </Popover>
        </div>
      )}

      {/* Mobile: BottomSheet (mobileCollapse=true) — 2+ filtros, ou 1 filtro + actions */}
      {mobileCollapse && (filters.length >= 2 || actions) && (
        <div className="md:hidden">
          <FiltersButton count={activeFilterCount} onClick={() => setSheetOpen(true)} />
          <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filtros">
            <div className="space-y-4">
              <FilterGroups
                filters={filters}
                onPick={(f, v) => { f.onChange(v); setSheetOpen(false); }}
                onClear={onClear ? () => { onClear(); setSheetOpen(false); } : undefined}
                showClear={activeFilterCount > 0}
              />
              {actions && (
                <div className="pt-2 border-t border-stroke-default">{actions}</div>
              )}
            </div>
          </BottomSheet>
        </div>
      )}

      {/* Actions: visível em desktop sempre; em mobile só quando !mobileCollapse */}
      {mobileCollapse
        ? <div className="hidden md:flex items-center">{actions}</div>
        : actions
      }
    </div>
  );
}
