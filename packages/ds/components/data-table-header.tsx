'use client';

import { useState, type ComponentPropsWithRef, type ReactElement, type ReactNode } from 'react';
import { Button } from './button';
import { Chip } from './chip';
import { Drawer } from './drawer';
import { DropdownMenu, DropdownMenuRadioGroup, DropdownMenuRadioItem } from './dropdown-menu';
import { FilterChip, FilterChipGroup } from './filter-chip';
import { IconButton } from './icon-button';
import { Input } from './input';
import { ChevronDownIcon, CloseIcon, SearchIcon, SlidersIcon } from './internal/icons';
import { Popover } from './popover';
import { Separator } from './separator';
import { Tooltip } from './tooltip';

export type DataTableHeaderSearch = {
  value: string;
  onChange: (v: string) => void;
  /** Also the field's accessible name. Default "Buscar…". */
  placeholder?: string;
};

export type DataTableFilterOption = {
  value: string;
  label: string;
  count?: number;
};

export type DataTableFilterDef = {
  key: string;
  label: string;
  /** The chosen option; '' is "all" (no filter). */
  value: string;
  options: DataTableFilterOption[];
  onChange: (v: string) => void;
};

export type DataTablePillDef = {
  key: string;
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
};

export type DataTableHeaderProps = {
  search?: DataTableHeaderSearch;
  filters?: DataTableFilterDef[];
  /** Quick filters, always in view: FilterChips. */
  pillFilters?: DataTablePillDef[];
  onClear?: () => void;
  actions?: ReactNode;
  className?: string;
  /** On a narrow screen, moves the filters and the actions into a Drawer. The quick filters stay in view. */
  mobileCollapse?: boolean;
};

function optionLabel(filter: DataTableFilterDef) {
  if (filter.value === '') return filter.label;
  return filter.options.find((o) => o.value === filter.value)?.label ?? filter.label;
}

/** The trigger of one filter: an outline Button with the chosen option (filled while a value is chosen). */
function FilterTrigger({ filter, ...rest }: { filter: DataTableFilterDef } & Omit<ComponentPropsWithRef<'button'>, 'children'>) {
  return (
    <Button {...rest} tone="neutral" variant={filter.value !== '' ? 'fill' : 'outline'} icon={<ChevronDownIcon />}>
      {optionLabel(filter)}
    </Button>
  );
}

/** One filter as a DropdownMenu of radio items (one filter on a wide screen). */
export function FilterDropdown({ f, placement = 'bottom-start' }: { f: DataTableFilterDef; placement?: 'bottom-start' | 'bottom-end' }) {
  return (
    <DropdownMenu align={placement === 'bottom-end' ? 'end' : 'start'} aria-label={f.label} trigger={<FilterTrigger filter={f} />}>
      <DropdownMenuRadioGroup value={f.value} onValueChange={f.onChange}>
        {f.options.map((opt) => (
          <DropdownMenuRadioItem key={opt.value} value={opt.value} textValue={opt.label}>
            {opt.count != null ? `${opt.label} · ${opt.count}` : opt.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenu>
  );
}

/**
 * "Filtros" with how many are on, in the label ("Filtros · 3", as in the Figma: the Button has no Badge): an outline
 * Button with the sliders before the text (filled while any is on). Forwards its ref for the Popover.
 */
function FiltersButton({ count, ...rest }: { count: number } & Omit<ComponentPropsWithRef<'button'>, 'children'>) {
  return (
    <Button
      {...rest}
      tone="neutral"
      variant={count > 0 ? 'fill' : 'outline'}
      icon={<SlidersIcon />}
      iconPosition="start"
      data-filter-toggle=""
    >
      {count > 0 ? `Filtros · ${count}` : 'Filtros'}
    </Button>
  );
}

/** The filters stacked: each one a labelled FilterChipGroup, one chip per option. */
function FilterGroups({
  filters,
  onPick,
  onClear,
  showClear,
}: {
  filters: DataTableFilterDef[];
  onPick: (f: DataTableFilterDef, value: string) => void;
  onClear?: () => void;
  showClear: boolean;
}) {
  return (
    <div className="rds-data-table-header__groups">
      {filters.map((f) => (
        <div key={f.key} className="rds-data-table-header__group">
          <p className="rds-data-table-header__group-label" aria-hidden="true">
            {f.label}
          </p>
          <FilterChipGroup aria-label={f.label}>
            {f.options.map((opt) => (
              <FilterChip key={opt.value} active={f.value === opt.value} count={opt.count} onClick={() => onPick(f, opt.value)}>
                {opt.label}
              </FilterChip>
            ))}
          </FilterChipGroup>
        </div>
      ))}
      {onClear && showClear && (
        <Button tone="neutral" variant="ghost" onClick={onClear}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}

/** The stacked filters in a Popover. Picking closes it. */
function FiltersPopover({
  filters,
  onClear,
  showClear,
  trigger,
}: {
  filters: DataTableFilterDef[];
  onClear?: () => void;
  showClear: boolean;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover trigger={trigger} aria-label="Filtros" side="bottom" align="end" open={open} onOpenChange={setOpen}>
      <div className="rds-data-table-header__scroll">
        <FilterGroups
          filters={filters}
          onPick={(f, v) => {
            f.onChange(v);
            setOpen(false);
          }}
          onClear={
            onClear
              ? () => {
                  onClear();
                  setOpen(false);
                }
              : undefined
          }
          showClear={showClear}
        />
      </div>
    </Popover>
  );
}

/** One filter on a narrow screen: its trigger opens a Drawer with the options (never a popover on a phone). */
function MobileSingleFilter({ f }: { f: DataTableFilterDef }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <FilterTrigger filter={f} onClick={() => setOpen(true)} />
      <Drawer open={open} onOpenChange={setOpen} title={f.label}>
        <FilterGroups
          filters={[f]}
          onPick={(_, v) => {
            f.onChange(v);
            setOpen(false);
          }}
          showClear={false}
        />
      </Drawer>
    </>
  );
}

/**
 * DataTableHeader — a composition of the Input (search), FilterChips, Buttons, the DropdownMenu, the Popover and
 * the Drawer: the bar above a table. The search fills the row; quick filters are FilterChips; one filter is a
 * dropdown, two or more collapse into "Filtros" (the active ones stay in view as removable Chips). From 768 the
 * wide layout shows; below it, the filters open in a Drawer or a Popover. Styles: data-table-header.css.
 */
export function DataTableHeader({
  search,
  filters = [],
  pillFilters = [],
  onClear,
  actions,
  className,
  mobileCollapse = false,
}: DataTableHeaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeFilterCount = filters.filter((f) => f.value !== '').length + pillFilters.filter((p) => p.active).length;
  // Two or more filters collapse into "Filtros" on a wide screen; the active ones stay in view as Chips.
  const collapseDesktop = filters.length >= 2;
  const activeFilters = filters.filter((f) => f.value !== '');
  // One filter is a direct dropdown on a narrow screen too.
  const singleFilter = filters.length === 1 ? filters[0] : null;
  const lead = Boolean(search || pillFilters.length > 0);

  return (
    <div className={['rds-data-table-header', className].filter(Boolean).join(' ')}>
      {search && (
        <Input
          className="rds-data-table-header__search"
          type="search"
          aria-label={search.placeholder ?? 'Buscar…'}
          placeholder={search.placeholder ?? 'Buscar…'}
          leadingIcon={<SearchIcon />}
          clearable
          clearLabel="Limpar busca"
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
        />
      )}

      {pillFilters.length > 0 && (
        <FilterChipGroup aria-label="Filtros rápidos" data-pill-filter="">
          {pillFilters.map((p) => (
            <FilterChip key={p.key} active={p.active} count={p.count} onClick={p.onClick}>
              {p.label}
            </FilterChip>
          ))}
        </FilterChipGroup>
      )}

      {filters.length > 0 && (
        <div className="rds-data-table-header__wide">
          {lead && <Separator orientation="vertical" />}
          {collapseDesktop ? (
            <>
              {activeFilters.map((f) => (
                <Chip key={f.key} onRemove={() => f.onChange('')} removeLabel={`Remover filtro ${f.label}`}>
                  {optionLabel(f)}
                </Chip>
              ))}
              <FiltersPopover
                filters={filters}
                onClear={onClear}
                showClear={activeFilterCount > 0}
                trigger={<FiltersButton count={activeFilterCount} />}
              />
            </>
          ) : (
            filters.map((f) => <FilterDropdown key={f.key} f={f} />)
          )}
          {/* Collapsed, clearing lives in the popover. */}
          {onClear && activeFilterCount > 0 && !collapseDesktop && (
            <Tooltip text="Limpar filtros">
              <IconButton icon={<CloseIcon />} label="Limpar filtros" variant="ghost" tone="neutral" onClick={onClear} />
            </Tooltip>
          )}
        </div>
      )}

      {singleFilter && !(mobileCollapse && actions) && (
        <div className="rds-data-table-header__narrow">
          <MobileSingleFilter f={singleFilter} />
        </div>
      )}

      {!mobileCollapse && filters.length >= 2 && (
        <div className="rds-data-table-header__narrow">
          <FiltersPopover
            filters={filters}
            onClear={onClear}
            showClear={activeFilterCount > 0}
            trigger={<FiltersButton count={activeFilterCount} />}
          />
        </div>
      )}

      {mobileCollapse && (filters.length >= 2 || actions) && (
        <div className="rds-data-table-header__narrow">
          <FiltersButton count={activeFilterCount} onClick={() => setSheetOpen(true)} />
          <Drawer open={sheetOpen} onOpenChange={setSheetOpen} title="Filtros">
            <div className="rds-data-table-header__groups">
              <FilterGroups
                filters={filters}
                onPick={(f, v) => {
                  f.onChange(v);
                  setSheetOpen(false);
                }}
                onClear={
                  onClear
                    ? () => {
                        onClear();
                        setSheetOpen(false);
                      }
                    : undefined
                }
                showClear={activeFilterCount > 0}
              />
              {actions && <div className="rds-data-table-header__drawer-actions">{actions}</div>}
            </div>
          </Drawer>
        </div>
      )}

      {/* The actions: always on a wide screen; on a narrow one only without mobileCollapse (else in the Drawer). */}
      {actions && <div className={mobileCollapse ? 'rds-data-table-header__wide' : 'rds-data-table-header__actions'}>{actions}</div>}
    </div>
  );
}
