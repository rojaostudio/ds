'use client';

import { useState, type ComponentPropsWithRef, type ReactElement, type ReactNode } from 'react';
import { Badge } from './badge';
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

export type DataTableHeaderProps = {
  search?: DataTableHeaderSearch;
  filters?: DataTableFilterDef[];
  /**
   * Quick filters, always in view (Figma: `showQuickFilters` + the `quickFilters` slot): up to three, a
   * FilterChipGroup with its FilterChips; four or more, one Button with a menu (DropdownMenu), "Categoria: Todas".
   */
  quickFilters?: ReactNode;
  /** Clears the `filters` (the quick filters are cleared where they are, in view). */
  onClear?: () => void;
  /**
   * A view control after the filters and before the actions (Figma: `showView` + the `view` slot), such as a
   * Checkbox "Agrupar por produto". In view in the compact arrangement too.
   */
  view?: ReactNode;
  /**
   * The list's action (Figma: `showActions`, off by default, + the `actions` instance): an IconButton, neutral outline
   * md, with its Tooltip, such as a gear "Organizar categorias" or exporting. It sits outside the tools, always at the
   * end of the FIRST line, on the right; the tools wrap, the action never goes down.
   * Creating is NOT an action of the bar: creating is the FAB. The component does not enforce this; it documents it.
   */
  actions?: ReactNode;
  className?: string;
  /** In the compact arrangement (bar below 1024), moves the filters and the actions into a Drawer. The quick filters stay in view. */
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

/** One filter as a DropdownMenu of radio items (one filter, expanded). */
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
              <FilterChip key={opt.value} pressed={f.value === opt.value} count={opt.count} onClick={() => onPick(f, opt.value)}>
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

/**
 * The filter in the compact arrangement (Figma: `filter trigger`): an outline IconButton of 44 with the sliders, with
 * its Tooltip (the label). While a filter is on, a dot (one filter) or a neutral Badge with how many (several) sits on
 * its corner, aria-hidden: the state goes in the accessible name ("Categoria, Pago", "Filtros, 3 ativos"). Any other
 * prop and the ref go to the IconButton, so it can be the trigger of the Popover.
 */
function CompactFilterTrigger({
  label,
  state,
  indicator,
  ...rest
}: {
  /** The filter's name, also the Tooltip ("Categoria", "Filtros"). */
  label: string;
  /** What is on, appended to the name; nothing when no filter is on. */
  state?: string;
  /** `'dot'` (one filter on), a number (several filters, how many are on) or nothing. */
  indicator?: 'dot' | number;
} & Omit<ComponentPropsWithRef<'button'>, 'children'>) {
  return (
    <span className="rds-data-table-header__trigger">
      <Tooltip text={label}>
        <IconButton
          {...rest}
          icon={<SlidersIcon />}
          label={state ? `${label}, ${state}` : label}
          variant="outline"
          tone="neutral"
          size="md"
          data-filter-toggle=""
        />
      </Tooltip>
      {indicator === 'dot' && <span className="rds-data-table-header__dot" aria-hidden="true" />}
      {typeof indicator === 'number' && (
        <Badge className="rds-data-table-header__count" tone="neutral" value={indicator} aria-hidden="true" />
      )}
    </span>
  );
}

/** "3 ativos", "1 ativo": the state of "Filtros" in its accessible name. */
function activeState(count: number) {
  if (count === 0) return undefined;
  return count === 1 ? '1 ativo' : `${count} ativos`;
}

/** One filter in the compact arrangement: its IconButton opens a Drawer with the options (never a popover on a phone). */
function MobileSingleFilter({ f }: { f: DataTableFilterDef }) {
  const [open, setOpen] = useState(false);
  const on = f.value !== '';
  return (
    <>
      <CompactFilterTrigger
        label={f.label}
        state={on ? optionLabel(f) : undefined}
        indicator={on ? 'dot' : undefined}
        onClick={() => setOpen(true)}
      />
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
 * the Drawer: the bar above a table. A row that never wraps: the tools (the search, the quick filters, the filters,
 * the view control) wrap inside their own group; the action stays outside it, at the end of the first line, on the
 * right. The search is always on the left and takes the free width (at least 320); the filters are always on the
 * right; what does not fit wraps. Quick filters go in the `quickFilters` slot; one filter
 * is a dropdown, two or more collapse into "Filtros" (the active ones stay in view as removable Chips); the `view`
 * control comes after the filters, before the actions. "Filtros · N" counts the active `filters`, the ones that
 * button opens.
 *
 * Two arrangements, by the screen width, as the Figma viewport mode (layout/compact below lg 1024; the SavingBar's cut):
 * expanded from 1024, the Separator and the Buttons with their labels; compact below it, the search accepts 200 and
 * the filter is an outline IconButton (sliders, 44) with a dot (one filter on) or a counter (several), opening the
 * same Drawer or Popover. There is no screen prop.
 * Styles: data-table-header.css.
 */
export function DataTableHeader({
  search,
  filters = [],
  quickFilters,
  onClear,
  view,
  actions,
  className,
  mobileCollapse = false,
}: DataTableHeaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  // The count says how many of the filters behind "Filtros" are on; the quick filters show their own state in view.
  const activeFilterCount = filters.filter((f) => f.value !== '').length;
  // Two or more filters collapse into "Filtros" when expanded; the active ones stay in view as Chips.
  const collapseDesktop = filters.length >= 2;
  const activeFilters = filters.filter((f) => f.value !== '');
  // One filter has its own trigger in the compact arrangement too (a Drawer with its options).
  const singleFilter = filters.length === 1 ? filters[0] : null;
  const lead = Boolean(search || quickFilters);

  return (
    <div className={['rds-data-table-header', className].filter(Boolean).join(' ')}>
      <div className="rds-data-table-header__tools">
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

        {quickFilters && <div className="rds-data-table-header__quick">{quickFilters}</div>}

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
              trigger={
                <CompactFilterTrigger
                  label="Filtros"
                  state={activeState(activeFilterCount)}
                  indicator={activeFilterCount > 0 ? activeFilterCount : undefined}
                />
              }
            />
          </div>
        )}

        {mobileCollapse && (filters.length >= 2 || actions) && (
          <div className="rds-data-table-header__narrow">
            <CompactFilterTrigger
              label="Filtros"
              state={activeState(activeFilterCount)}
              indicator={activeFilterCount === 0 ? undefined : filters.length === 1 ? 'dot' : activeFilterCount}
              onClick={() => setSheetOpen(true)}
            />
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

        {view && <div className="rds-data-table-header__view">{view}</div>}
      </div>

      {/* The action, outside the tools: always when expanded; compact only without mobileCollapse (else in the Drawer). */}
      {actions && (
        <div className={['rds-data-table-header__actions', mobileCollapse && 'rds-data-table-header__wide'].filter(Boolean).join(' ')}>
          {actions}
        </div>
      )}
    </div>
  );
}
