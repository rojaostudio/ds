'use client';

import { useRef, useState, type ComponentPropsWithRef, type ReactElement, type ReactNode } from 'react';
import { Button } from './button';
import { Chip } from './chip';
import { Drawer } from './drawer';
import { DropdownMenu, DropdownMenuRadioGroup, DropdownMenuRadioItem } from './dropdown-menu';
import { FilterChip, FilterChipGroup } from './filter-chip';
import { IconButton } from './icon-button';
import { Input } from './input';
import { SearchIcon, SlidersIcon } from './internal/icons';
import { Popover } from './popover';
import { Tooltip } from './tooltip';

export type DataTableHeaderSearch = {
  value: string;
  onChange: (v: string) => void;
  /** What the field shows while empty, saying what is searched ("Buscar produtos…"). Default "Buscar…". */
  placeholder?: string;
  /** The field's accessible name, apart from the placeholder ("Buscar produtos"). Default "Buscar". */
  label?: string;
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
   * FilterChipGroup with its FilterChips; four or more, or more than one ticked, a FilterChipMenu ("Processo: Todos"),
   * so the whole bar stays at 32.
   * No quick filters: do not pass the slot (Figma: `showQuickFilters` false). Wrapped in a group "Filtros rápidos".
   */
  quickFilters?: ReactNode;
  /**
   * Clears the `filters` (Figma: `clear`, "Limpar filtros" at the end of the active filters line, shown while a
   * filter is on). The focus goes back to the search.
   */
  onClear?: () => void;
  /**
   * A view control after the filters (Figma: `showView` + the `view` slot), such as a Checkbox "Agrupar por
   * produto". In view in the compact arrangement too.
   */
  view?: ReactNode;
  /**
   * How many results (Figma: `showCount` + `count`), at the end of the tools: "128 resultados". A live region
   * (aria-live polite), so the total is announced as the list is filtered.
   */
  count?: ReactNode;
  /**
   * The list's action (Figma: `showActions`, off by default, + the `actions` instance): an IconButton, neutral outline
   * sm (the whole bar is 32, Figma 07/10), with its Tooltip, such as a gear "Organizar categorias" or exporting. It sits outside the tools, always at the
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

/** "Status: Abertos": the text of an active filter's Chip. */
function chipLabel(filter: DataTableFilterDef) {
  return `${filter.label}: ${optionLabel(filter)}`;
}

/**
 * The trigger of one filter, expanded (Figma `.filter-trigger`, expanded): a Button with the sliders before its
 * label, outline, filled while a value is chosen; then its name says the value too ("Status, Abertos").
 */
function FilterTrigger({ filter, ...rest }: { filter: DataTableFilterDef } & Omit<ComponentPropsWithRef<'button'>, 'children'>) {
  const on = filter.value !== '';
  return (
    <Button
      {...rest}
      tone="neutral"
      variant={on ? 'fill' : 'outline'}
      size="sm"
      icon={<SlidersIcon />}
      iconPosition="start"
      aria-label={on ? `${filter.label}, ${optionLabel(filter)}` : undefined}
      data-filter-toggle=""
    >
      {filter.label}
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
 * "Filtros" with how many are on, in the label ("Filtros · 3", as the Figma `.filter-trigger` expanded): an outline
 * Button with the sliders before the text (filled while any is on). Forwards its ref for the Popover.
 */
function FiltersButton({ count, ...rest }: { count: number } & Omit<ComponentPropsWithRef<'button'>, 'children'>) {
  return (
    <Button
      {...rest}
      tone="neutral"
      variant={count > 0 ? 'fill' : 'outline'}
      size="sm"
      icon={<SlidersIcon />}
      iconPosition="start"
      data-filter-toggle=""
    >
      {count > 0 ? `Filtros · ${count}` : 'Filtros'}
    </Button>
  );
}

/** The filters stacked: each one a labelled FilterChipGroup, one chip per option. */
function FilterGroups({ filters, onPick }: { filters: DataTableFilterDef[]; onPick: (f: DataTableFilterDef, value: string) => void }) {
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
    </div>
  );
}

/** The stacked filters in a Popover. Picking closes it; Escape closes it and gives the focus back to the trigger. */
function FiltersPopover({ filters, trigger }: { filters: DataTableFilterDef[]; trigger: ReactElement }) {
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
        />
      </div>
    </Popover>
  );
}

/**
 * The filter in the compact arrangement (Figma `.filter-trigger`, compact), with its Tooltip (the label): inactive,
 * an outline IconButton of 44 with the sliders; active, a fill Button with the sliders before how many are on ("2"),
 * no Badge over it. The name says the state ("Categoria, Pago", "Filtros, 2 ativos"). Any other prop and the ref go
 * to the button, so it can be the trigger of the Popover.
 */
function CompactFilterTrigger({
  label,
  state,
  active,
  ...rest
}: {
  /** The filter's name, also the Tooltip ("Categoria", "Filtros"). */
  label: string;
  /** What is on, appended to the name; nothing when no filter is on. */
  state?: string;
  /** How many filters are on (0: inactive). */
  active: number;
} & Omit<ComponentPropsWithRef<'button'>, 'children'>) {
  const name = state ? `${label}, ${state}` : label;
  return (
    <Tooltip text={label}>
      {active > 0 ? (
        <Button {...rest} tone="neutral" variant="fill" size="sm" icon={<SlidersIcon />} iconPosition="start" aria-label={name} data-filter-toggle="">
          {String(active)}
        </Button>
      ) : (
        <IconButton {...rest} icon={<SlidersIcon />} label={name} variant="outline" tone="neutral" size="sm" data-filter-toggle="" />
      )}
    </Tooltip>
  );
}

/** "3 ativos", "1 ativo": the state of "Filtros" in its accessible name. */
function activeState(count: number) {
  if (count === 0) return undefined;
  return count === 1 ? '1 ativo' : `${count} ativos`;
}

/** A Drawer opened by a button (not a Radix trigger): it says so (aria-haspopup, aria-expanded) and closing gives the focus back to it. */
function useDrawer() {
  const [open, setOpenState] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const setOpen = (next: boolean) => {
    setOpenState(next);
    if (!next) requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const triggerProps = {
    ref: triggerRef,
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': open,
    onClick: () => setOpen(true),
  };
  return { open, setOpen, triggerProps };
}

/** One filter in the compact arrangement: its trigger opens a Drawer with the options (never a popover on a phone). */
function MobileSingleFilter({ f }: { f: DataTableFilterDef }) {
  const { open, setOpen, triggerProps } = useDrawer();
  const on = f.value !== '';
  return (
    <>
      <CompactFilterTrigger {...triggerProps} label={f.label} state={on ? optionLabel(f) : undefined} active={on ? 1 : 0} />
      <Drawer open={open} onOpenChange={setOpen} title={f.label}>
        <FilterGroups
          filters={[f]}
          onPick={(_, v) => {
            f.onChange(v);
            setOpen(false);
          }}
        />
      </Drawer>
    </>
  );
}

/** mobileCollapse: the filters and the actions in one Drawer, opened by the compact "Filtros". */
function MobileCollapsedFilters({
  filters,
  actions,
  activeCount,
}: {
  filters: DataTableFilterDef[];
  actions?: ReactNode;
  activeCount: number;
}) {
  const { open, setOpen, triggerProps } = useDrawer();
  return (
    <>
      <CompactFilterTrigger {...triggerProps} label="Filtros" state={activeState(activeCount)} active={activeCount} />
      <Drawer open={open} onOpenChange={setOpen} title="Filtros">
        <div className="rds-data-table-header__groups">
          <FilterGroups
            filters={filters}
            onPick={(f, v) => {
              f.onChange(v);
              setOpen(false);
            }}
          />
          {actions && <div className="rds-data-table-header__drawer-actions">{actions}</div>}
        </div>
      </Drawer>
    </>
  );
}

/**
 * DataTableHeader — a composition of the Input (search), FilterChips, Chips, Buttons, the DropdownMenu, the Popover
 * and the Drawer: the bar above a table (Figma [RDS] DataTableHeader, no variants). Two lines, 8 apart:
 *
 * - `row`, which never wraps: the tools (the search, the quick filters, the filter trigger, the view control and the
 *   count) wrap inside their own group, packed to the start; the action stays outside it, at the end of the first
 *   line, on the right. The search is always first and takes the free width, at least `--data-table-header-search-min`
 *   (320; 200 below 1024); what does not fit wraps.
 * - `active`, only while a filter is on (one filter too): the active filters as removable Chips ("Status: Abertos"),
 *   wrapping, and "Limpar filtros" (a ghost sm Button, `onClear`) at the end, which gives the focus back to the search.
 *
 * Quick filters go in the `quickFilters` slot; 0 quick filters = do not pass the slot. One filter is a Button with a
 * menu; two or more collapse into "Filtros" (a Popover), the count in its label ("Filtros · 2"). No Separator between
 * the groups (it is left orphaned at the start of a wrapped line) and no Badge over the trigger.
 *
 * Two arrangements, by the screen width, as the Figma viewport mode (layout/compact below lg 1024; the SavingBar's cut):
 * expanded from 1024, the trigger is a Button with its label; compact below it, an outline IconButton (sliders, 44)
 * that, while a filter is on, becomes a fill Button with the number ("2"), named "Filtros, 2 ativos" or
 * "Categoria, Pago"; one filter opens a Drawer (never a popover on a phone). There is no screen prop.
 *
 * Tab order is the visual order: search → quick filters → filter trigger → view → action → active Chips → Limpar
 * filtros. Escape closes the menu, Popover or Drawer and gives the focus back to the trigger.
 * Styles: data-table-header.css.
 */
export function DataTableHeader({
  search,
  filters = [],
  quickFilters,
  onClear,
  view,
  count,
  actions,
  className,
  mobileCollapse = false,
}: DataTableHeaderProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeFilters = filters.filter((f) => f.value !== '');
  // How many of the filters behind the trigger are on; the quick filters show their own state in view.
  const activeFilterCount = activeFilters.length;
  // Two or more filters collapse into "Filtros" when expanded.
  const collapseDesktop = filters.length >= 2;
  // One filter has its own trigger in the compact arrangement too (a Drawer with its options).
  const singleFilter = filters.length === 1 ? filters[0] : null;

  const clear = () => {
    onClear?.();
    // The line of active filters goes away with the focused button: the focus goes back to the search (or the trigger).
    requestAnimationFrame(() => {
      if (searchRef.current) {
        searchRef.current.focus();
        return;
      }
      const toggles = rootRef.current?.querySelectorAll<HTMLElement>('[data-filter-toggle]') ?? [];
      [...toggles].find((t) => t.offsetParent !== null)?.focus();
    });
  };

  return (
    <div ref={rootRef} className={['rds-data-table-header', className].filter(Boolean).join(' ')}>
      <div className="rds-data-table-header__row">
        <div className="rds-data-table-header__tools">
          {search && (
            <div className="rds-data-table-header__search" role="search" aria-label={search.label ?? 'Buscar'}>
              <Input
                ref={searchRef}
                type="search"
                size="sm"
                aria-label={search.label ?? 'Buscar'}
                placeholder={search.placeholder ?? 'Buscar…'}
                leadingIcon={<SearchIcon />}
                clearable
                clearLabel="Limpar busca"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
              />
            </div>
          )}

          {quickFilters && (
            <div className="rds-data-table-header__quick" role="group" aria-label="Filtros rápidos">
              {quickFilters}
            </div>
          )}

          {filters.length > 0 && (
            <div className="rds-data-table-header__wide">
              {collapseDesktop ? (
                <FiltersPopover filters={filters} trigger={<FiltersButton count={activeFilterCount} />} />
              ) : (
                filters.map((f) => <FilterDropdown key={f.key} f={f} />)
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
                trigger={<CompactFilterTrigger label="Filtros" state={activeState(activeFilterCount)} active={activeFilterCount} />}
              />
            </div>
          )}

          {mobileCollapse && (filters.length >= 2 || actions) && (
            <div className="rds-data-table-header__narrow">
              <MobileCollapsedFilters filters={filters} actions={actions} activeCount={activeFilterCount} />
            </div>
          )}

          {view && <div className="rds-data-table-header__view">{view}</div>}

          {count != null && count !== false && (
            <span className="rds-data-table-header__count" aria-live="polite">
              {count}
            </span>
          )}
        </div>

        {/* The action, outside the tools: always when expanded; compact only without mobileCollapse (else in the Drawer). */}
        {actions && (
          <div className={['rds-data-table-header__actions', mobileCollapse && 'rds-data-table-header__wide'].filter(Boolean).join(' ')}>
            {actions}
          </div>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="rds-data-table-header__active">
          <div className="rds-data-table-header__chips">
            {activeFilters.map((f) => (
              <Chip key={f.key} onRemove={() => f.onChange('')} removeLabel={`Remover filtro ${chipLabel(f)}`}>
                {chipLabel(f)}
              </Chip>
            ))}
          </div>
          {onClear && (
            <Button tone="neutral" variant="ghost" size="sm" onClick={clear}>
              Limpar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
