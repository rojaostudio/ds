'use client';

import { forwardRef, useState, useRef, useEffect, useId, useImperativeHandle, type ReactNode } from 'react';
import { ChevronDown, Check, Search as SearchIcon, X, Plus } from 'lucide-react';
import { Popover } from './popover';

/**
 * Combobox — Search + Select. Lista filtrada por digitação.
 * Inspirado em shadcn Combobox / cmdk.
 *
 * Uso:
 *   <Combobox
 *     options={cities}
 *     value={selected}
 *     onChange={setSelected}
 *     placeholder="Buscar cidade..."
 *   />
 *
 * Multi-select:
 *   <Combobox
 *     multi
 *     options={tags}
 *     value={selectedTags}
 *     onChange={setSelectedTags}
 *   />
 *
 * Suporta filtro custom (por default usa includes case-insensitive em label).
 */

export interface ComboboxOption {
  value: string;
  label: string;
  /** Subtítulo opcional (ex: email abaixo do nome). */
  description?: string;
  /** Ícone leading. */
  icon?: ReactNode;
  disabled?: boolean;
}

interface ComboboxSingleProps {
  multi?:    false;
  value:     string | null;
  onChange:  (value: string | null) => void;
}

interface ComboboxMultiProps {
  multi:     true;
  value:     string[];
  onChange:  (value: string[]) => void;
}

export type ComboboxProps = (ComboboxSingleProps | ComboboxMultiProps) & {
  options:     ComboboxOption[];
  placeholder?: string;
  /** Filtro custom. default = includes case-insensitive em label/description. */
  filter?:     (option: ComboboxOption, query: string) => boolean;
  /** Texto quando lista vazia. default = "Nada encontrado". */
  emptyMessage?: string;
  /** Largura. default = full. */
  width?:      'full' | 'hug';
  size?:       'sm' | 'md';
  disabled?:   boolean;
  className?:  string;
  'aria-label'?: string;
  /** Customiza o conteúdo do trigger fechado (ex: só o ícone). default = ícone + label. */
  triggerContent?: (selected: ComboboxOption | null) => ReactNode;
  /** Largura mínima do dropdown em px. Útil quando o trigger é compacto (width="hug"). */
  dropdownMinWidth?: number;
  /** Buscar→criar: quando a busca não casa com nenhuma opção (por label), mostra uma
   *  linha "criar" que chama onCreate(query). Campo padrão tipo cliente/fornecedor. */
  onCreate?: (query: string) => void;
  /** Rótulo da linha de criar. default = `+ "<query>"`. Passe localizado. */
  createLabel?: (query: string) => string;
};

const SIZE_CLASS = {
  sm: 'h-8 text-caption px-2.5',
  md: 'h-10 text-label px-3',
} as const;

function defaultFilter(opt: ComboboxOption, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  return opt.label.toLowerCase().includes(lower)
      || (opt.description?.toLowerCase().includes(lower) ?? false);
}

export const Combobox = forwardRef<HTMLButtonElement, ComboboxProps>(function Combobox(props, ref) {
  const {
    options,
    placeholder = 'Selecione…',
    filter = defaultFilter,
    emptyMessage = 'Nada encontrado',
    width = 'full',
    size = 'md',
    disabled = false,
    className = '',
    triggerContent,
    dropdownMinWidth,
    onCreate,
    createLabel = (q) => `+ "${q}"`,
  } = props;

  const isMulti = props.multi === true;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [dropdownWidth, setDropdownWidth] = useState<number>(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const id = useId();

  useImperativeHandle(ref, () => triggerRef.current!);

  // Mede largura do trigger para o dropdown no portal igualar
  useEffect(() => {
    if (open && triggerRef.current) {
      setDropdownWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  // Open: foca input, reseta active
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
      setActiveIdx(0);
    } else {
      setQuery('');
    }
  }, [open]);

  const filtered = options.filter(o => filter(o, query));

  // Buscar→criar: oferece criar quando há texto e nenhuma opção casa exatamente (por label).
  const trimmed = query.trim();
  const showCreate = !!onCreate && trimmed.length > 0
    && !options.some(o => o.label.toLowerCase() === trimmed.toLowerCase());

  function doCreate() {
    if (!onCreate || !trimmed) return;
    onCreate(trimmed);
    setOpen(false);
  }

  function isSelected(opt: ComboboxOption): boolean {
    return isMulti
      ? (props.value as string[]).includes(opt.value)
      : (props.value as string | null) === opt.value;
  }

  function selectedOption(): ComboboxOption | null {
    if (isMulti) return null;
    return options.find(o => o.value === (props.value as string | null)) ?? null;
  }

  function handleSelect(opt: ComboboxOption) {
    if (opt.disabled) return;
    if (isMulti) {
      const current = props.value as string[];
      const next = current.includes(opt.value)
        ? current.filter(v => v !== opt.value)
        : [...current, opt.value];
      (props.onChange as (v: string[]) => void)(next);
    } else {
      (props.onChange as (v: string) => void)(opt.value);
      setOpen(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[activeIdx];
      if (opt) handleSelect(opt);
      else if (showCreate) doCreate();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const sel = selectedOption();
  const triggerLabel = isMulti
    ? (props.value as string[]).length === 0
      ? placeholder
      : `${(props.value as string[]).length} selecionado(s)`
    : sel?.label ?? placeholder;
  const isPlaceholder = isMulti ? (props.value as string[]).length === 0 : !sel;

  const dropdown = (
    <div
      id={id}
      role="listbox"
      style={{ width: Math.max(dropdownWidth, dropdownMinWidth ?? 0) || undefined }}
      className="max-h-72 overflow-hidden rounded-(--radius-control) border border-stroke-control bg-surface-default shadow-lg flex flex-col"
    >
      <div className="relative shrink-0 border-b border-stroke-subtle">
        <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
          onKeyDown={handleKey}
          placeholder="Buscar…"
          className="w-full pl-9 pr-8 py-2 text-label bg-transparent outline-none text-fg-primary placeholder:text-fg-placeholder"
          aria-label="Buscar opções"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            aria-label="Limpar"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary p-1"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className="overflow-y-auto py-1 max-h-60">
        {filtered.length === 0 && !showCreate ? (
          <div className="px-3 py-3 text-label text-fg-muted text-center">{emptyMessage}</div>
        ) : (
          <>
            {filtered.map((opt, idx) => {
              const selected = isSelected(opt);
              const active   = idx === activeIdx;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className={[
                    'w-full flex items-start gap-2.5 px-3 py-2 text-label text-left transition-colors',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    active ? 'bg-surface-raised' : 'hover:bg-surface-raised',
                  ].join(' ')}
                >
                  {opt.icon && <span className="shrink-0 text-fg-muted mt-0.5 [&_svg]:size-4">{opt.icon}</span>}
                  <span className="flex-1 min-w-0">
                    <span className="block text-fg-primary truncate">{opt.label}</span>
                    {opt.description && (
                      <span className="block text-caption text-fg-muted truncate">{opt.description}</span>
                    )}
                  </span>
                  {selected && <Check size={14} className="shrink-0 text-fg-muted mt-0.5" />}
                </button>
              );
            })}
            {showCreate && (
              <button
                type="button"
                onClick={doCreate}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-label text-left text-fg-primary transition-colors hover:bg-surface-raised border-t border-stroke-subtle"
              >
                <Plus size={14} className="shrink-0 text-fg-muted" />
                <span className="truncate">{createLabel(trimmed)}</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className={['relative inline-block', width === 'full' ? 'w-full' : 'w-auto', className].join(' ')}>
      <Popover
        trigger={
          <button
            ref={triggerRef}
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!disabled) setOpen(o => !o); }}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={id}
            className={[
              'w-full flex items-center justify-between gap-2 rounded-(--radius-control) border border-stroke-control bg-surface-default',
              'transition-colors focus:outline-none focus:border-stroke-focus focus:ring-2 focus:ring-stroke-focus/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              SIZE_CLASS[size],
            ].join(' ')}
          >
            <span className={['truncate inline-flex items-center', isPlaceholder ? 'text-fg-placeholder' : 'text-fg-primary'].join(' ')}>
              {triggerContent
                ? triggerContent(sel)
                : (<>
                    {sel?.icon && <span className="inline-flex mr-2 align-middle [&_svg]:size-4">{sel.icon}</span>}
                    {triggerLabel}
                  </>)}
            </span>
            <ChevronDown size={16} className="text-fg-muted shrink-0" />
          </button>
        }
        triggerClassName={width === 'full' ? 'block w-full' : 'inline-block'}
        placement="bottom-start"
        offset={4}
        open={open}
        onOpenChange={(v) => { if (!disabled) setOpen(v); }}
      >
        {() => dropdown}
      </Popover>
    </div>
  );
});
