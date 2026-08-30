'use client';

import { useId, type ReactNode } from 'react';

/**
 * ToggleGroup — botões segmentados (M3 segmented buttons / shadcn ToggleGroup).
 *
 * Uso (single):
 *   <ToggleGroup value={view} onChange={setView} options={[
 *     { value: 'day',   label: 'Dia' },
 *     { value: 'week',  label: 'Semana' },
 *     { value: 'month', label: 'Mês' },
 *   ]} />
 *
 * Uso (multi):
 *   <ToggleGroup type="multi" value={selected} onChange={setSelected} options={[
 *     { value: 'bold', icon: <Bold /> },
 *     { value: 'italic', icon: <Italic /> },
 *   ]} />
 */

export interface ToggleOption<T extends string = string> {
  value:    T;
  label?:   string;
  icon?:    ReactNode;
  /** Estilos inline aplicados ao botão — use para fontFamily por opção, etc. */
  style?:   React.CSSProperties;
  disabled?: boolean;
}

interface ToggleGroupSingleProps<T extends string> {
  type?:    'single';
  /** Label renderada acima do controle (mesmo padrão do Input do DS). */
  label?:   ReactNode;
  value:    T | null;
  /** null quando allowDeselect=true e o item ativo é clicado novamente. */
  onChange: (value: T | null) => void;
  options:  ToggleOption<T>[];
  size?:    'sm' | 'md' | 'lg';
  /** Cor do item selecionado. 'brand' (default) pinta com a cor da marca; 'neutral'
   *  usa tinta neutra de alto contraste (surface-invert) — para controles utilitários
   *  que não devem vestir a paleta da loja. */
  selectedTone?: 'brand' | 'neutral';
  /** Se permite desselecionar o ativo (clica de novo = null). default = false. */
  allowDeselect?: boolean;
  /** Botões crescem para preencher toda a largura do container. */
  stretch?: boolean;
  className?: string;
  'aria-label'?: string;
}

interface ToggleGroupMultiProps<T extends string> {
  type:     'multi';
  /** Label renderada acima do controle (mesmo padrão do Input do DS). */
  label?:   ReactNode;
  value:    T[];
  onChange: (value: T[]) => void;
  options:  ToggleOption<T>[];
  size?:    'sm' | 'md' | 'lg';
  /** Cor do item selecionado. 'brand' (default) pinta com a cor da marca; 'neutral'
   *  usa tinta neutra de alto contraste (surface-invert). */
  selectedTone?: 'brand' | 'neutral';
  /** Botões crescem para preencher toda a largura do container. */
  stretch?: boolean;
  className?: string;
  'aria-label'?: string;
}

export type ToggleGroupProps<T extends string = string> =
  | ToggleGroupSingleProps<T>
  | ToggleGroupMultiProps<T>;

const SIZE_CLASS = {
  sm: 'h-control-sm text-caption px-2.5 gap-1',
  md: 'h-control-md text-label px-3 gap-1.5',
  lg: 'h-control-lg text-label px-4 gap-2',
} as const;

export function ToggleGroup<T extends string = string>(props: ToggleGroupProps<T>) {
  const options   = props.options;
  const size      = props.size      ?? 'md';
  const className = props.className ?? '';
  const stretch   = props.stretch   ?? false;
  const label     = props.label;
  const selectedTone = props.selectedTone ?? 'brand';
  const isMulti = props.type === 'multi';
  const groupId = useId();

  function isActive(opt: ToggleOption<T>): boolean {
    return isMulti
      ? (props.value as T[]).includes(opt.value)
      : (props.value as T | null) === opt.value;
  }

  function handleClick(opt: ToggleOption<T>) {
    if (opt.disabled) return;
    if (isMulti) {
      const current = props.value as T[];
      const next = current.includes(opt.value)
        ? current.filter(v => v !== opt.value)
        : [...current, opt.value];
      (props.onChange as (v: T[]) => void)(next);
    } else {
      const single = props as ToggleGroupSingleProps<T>;
      if (single.allowDeselect && single.value === opt.value) {
        single.onChange(null);
      } else {
        single.onChange(opt.value);
      }
    }
  }

  // Sem label, className segue no container de hoje (retrocompatível); com label,
  // migra pro wrapper externo e o grupo fica com a largura natural.
  const group = (
    <div
      id={groupId}
      role={isMulti ? 'group' : 'radiogroup'}
      aria-label={props['aria-label']}
      className={[
        stretch ? 'flex w-full' : 'inline-flex',
        'rounded-(--radius-control) border border-stroke-default bg-surface-default p-0.5 gap-0.5',
        label ? '' : className,
      ].join(' ')}
    >
      {options.map(opt => {
        const active = isActive(opt);
        return (
          <button
            key={opt.value}
            type="button"
            role={isMulti ? 'switch' : 'radio'}
            aria-checked={active}
            disabled={opt.disabled}
            style={opt.style}
            onClick={() => handleClick(opt)}
            className={[
              'inline-flex items-center justify-center rounded-(--radius-control) font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:z-10',
              'disabled:cursor-not-allowed disabled:opacity-50',
              stretch ? 'flex-1' : '',
              SIZE_CLASS[size],
              active
                ? (selectedTone === 'neutral'
                    ? 'bg-surface-invert text-fg-inverse'
                    : 'bg-brand-primary text-brand-on-primary')
                : 'text-fg-secondary hover:text-fg-primary hover:bg-surface-raised',
            ].join(' ')}
          >
            {opt.icon && <span className="[&_svg]:size-4 shrink-0">{opt.icon}</span>}
            {opt.label && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );

  if (!label) return group;

  return (
    <div className={['flex flex-col gap-1.5', className].join(' ')}>
      <label htmlFor={groupId} className="text-label font-medium text-fg-primary">{label}</label>
      {group}
    </div>
  );
}
