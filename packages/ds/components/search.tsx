'use client';

import { forwardRef, useEffect, useRef, type InputHTMLAttributes } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';

/**
 * Search — input dedicado de busca. Ícone leading + botão clear quando tem valor.
 *
 * Uso (uncontrolled):
 *   <Search placeholder="Buscar pedidos..." onSearch={q => doSearch(q)} />
 *
 * Uso (controlled):
 *   <Search value={q} onChange={e => setQ(e.target.value)} onClear={() => setQ('')} />
 *
 * Disparos de busca:
 *   - onSearch(query): debounce automático (default 250ms) ou Enter pressed
 *   - onChange: cada keystroke (caso queira live-search direto)
 */

export interface SearchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'size'> {
  onChange?:  InputHTMLAttributes<HTMLInputElement>['onChange'];
  /** Callback debounced (250ms) ou em Enter. */
  onSearch?:  (query: string) => void;
  /** Callback do botão clear. */
  onClear?:   () => void;
  /** Tamanho. default = md. */
  size?:      'sm' | 'md' | 'lg';
  /** Largura full ou hug. default = full. */
  width?:     'full' | 'hug';
}

const SIZE_CLASS = {
  sm: 'h-control-sm text-caption pl-8 pr-7',
  md: 'h-control-md text-label pl-9 pr-8',
  lg: 'h-control-lg text-body pl-10 pr-9',
} as const;

const ICON_SIZE = { sm: 14, md: 16, lg: 18 } as const;
const ICON_POS  = { sm: 'left-2.5', md: 'left-3', lg: 'left-3.5' } as const;
const CLEAR_POS = { sm: 'right-1.5', md: 'right-2', lg: 'right-2.5' } as const;

export const Search = forwardRef<HTMLInputElement, SearchProps>(function Search(
  { size = 'md', width = 'full', onSearch, onClear, onChange, value, className = '', ...rest },
  ref,
) {
  const hasValue = !!(value ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange?.(e);
    if (onSearch) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(e.target.value), 250);
    }
  }

  function handleClear() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onClear?.();
  }

  return (
    <div className={['relative inline-flex', width === 'full' ? 'w-full' : 'w-auto'].join(' ')}>
      <SearchIcon
        size={ICON_SIZE[size]}
        className={['absolute top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none', ICON_POS[size]].join(' ')}
      />
      <input
        ref={ref}
        type="search"
        role="searchbox"
        value={value}
        onChange={handleChange}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            onSearch?.((e.target as HTMLInputElement).value);
          }
        }}
        className={[
          'w-full rounded-(--radius-control) bg-surface-default text-fg-primary placeholder:text-fg-placeholder',
          'border border-stroke-control transition-colors outline-none',
          'focus:border-stroke-focus focus:ring-2 focus:ring-stroke-focus/20',
          '[&::-webkit-search-cancel-button]:hidden',
          SIZE_CLASS[size],
          className,
        ].join(' ')}
        {...rest}
      />
      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpar busca"
          className={[
            'absolute top-1/2 -translate-y-1/2 inline-flex items-center justify-center',
            'rounded-(--radius-control) text-fg-muted hover:text-fg-primary transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus',
            CLEAR_POS[size],
          ].join(' ')}
        >
          <X size={ICON_SIZE[size] - 2} />
        </button>
      )}
    </div>
  );
});
