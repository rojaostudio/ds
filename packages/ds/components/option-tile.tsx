'use client';

import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Check, type LucideIcon } from 'lucide-react';

/**
 * OptionTile / OptionTileGrid — grade de escolha única (onboarding #449).
 *
 * MESMA FAMÍLIA visual do ChoiceCard (os dois single-choice): casca idle suave
 * (borda 1px border-default, hover border-strong) e selecionado = fill SÓLIDO
 * derivado da camada semântica de seleção (--selection-fill-active). Baixa visão:
 * a seleção é distinguível por mais que cor — fill de alto contraste + check
 * redundante (badge on-fill, glifo fill), nunca só um realce sutil. Todo conteúdo
 * sobre o fill ativo usa tokens de contraste próprios (*-active → on-fill), nunca
 * os tokens de superfície clara.
 *
 * Acessibilidade: OptionTileGrid é um radiogroup com roving tabindex — só um tile é
 * tabbable; setas movem foco E seleção (padrão ARIA), Home/End vão às pontas.
 */

export interface OptionTileProps {
  selected: boolean;
  label: string;
  onClick: () => void;
  icon?: ReactNode; // nó pronto (o Grid converte LucideIcon → <Icon/>); ausente = tile textual
  disabled?: boolean;
  multiple?: boolean; // true = seleção múltipla (role checkbox); false = escolha única (role radio)
  tabIndex?: number;
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
  fullSpan?: boolean;
  className?: string;
}

export function OptionTile({
  selected, label, onClick, icon, disabled = false, multiple = false, tabIndex, onKeyDown, buttonRef, fullSpan = false, className = '',
}: OptionTileProps) {
  return (
    <button
      type="button"
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      tabIndex={tabIndex}
      disabled={disabled}
      ref={buttonRef}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={[
        'relative flex w-full flex-col items-center justify-center gap-2 rounded-(--radius-card) border text-center transition-all',
        icon ? 'min-h-[88px] px-3 py-4' : 'min-h-[52px] px-3 py-3',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2',
        selected
          ? '[border-color:var(--option-tile-border-active)] [background:var(--option-tile-bg-active)]'
          : '[border-color:var(--option-tile-border)] [background:var(--option-tile-bg)] hover:[border-color:var(--option-tile-border-hover)]',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        fullSpan ? 'col-span-full' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {selected && (
        <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full [background:var(--option-tile-check)] [color:var(--option-tile-check-icon)]">
          <Check size={11} strokeWidth={3} />
        </span>
      )}
      {icon && (
        <span
          className={[
            'flex size-10 items-center justify-center rounded-(--radius-card) transition-colors [&_svg]:size-5',
            selected
              ? '[background:var(--option-tile-icon-bg-active)] [color:var(--option-tile-icon-active)]'
              : '[background:var(--option-tile-icon-bg)] [color:var(--option-tile-icon)]',
          ].join(' ')}
        >
          {icon}
        </span>
      )}
      <span
        className={[
          icon ? 'text-caption' : 'text-label',
          'font-semibold leading-tight',
          selected ? '[color:var(--option-tile-label-active)]' : '[color:var(--option-tile-label)]',
        ].join(' ')}
      >
        {label}
      </span>
    </button>
  );
}

export interface OptionTileItem<T extends string = string> {
  value: T;
  label: string;
  icon?: LucideIcon; // componente lucide; ausente = tile textual (sub-nicho)
  fullSpan?: boolean; // ocupa a linha inteira (ex.: "Outro / vendo de tudo")
}

interface OptionTileGridBase<T extends string = string> {
  label?: ReactNode;
  options: OptionTileItem<T>[];
  /** 2 = sempre 2 colunas; 3 = 2 no mobile, 3 no >= sm. default 3. */
  columns?: 2 | 3;
  className?: string;
  'aria-label'?: string;
}
// União discriminada por `multiple`: single = radiogroup (value único), multi = checkbox
// group (value é lista, onChange devolve a lista já alternada).
type OptionTileGridSingle<T extends string = string> = OptionTileGridBase<T> & {
  multiple?: false;
  value: T | null;
  onChange: (value: T) => void;
};
type OptionTileGridMulti<T extends string = string> = OptionTileGridBase<T> & {
  multiple: true;
  value: T[];
  onChange: (value: T[]) => void;
};
export type OptionTileGridProps<T extends string = string> =
  | OptionTileGridSingle<T>
  | OptionTileGridMulti<T>;

export function OptionTileGrid<T extends string = string>(props: OptionTileGridProps<T>) {
  const { label, options, columns = 3, className = '' } = props;
  const ariaLabel = props['aria-label'];
  const multiple = props.multiple === true;
  const groupId = useId();
  const btns = useRef<(HTMLButtonElement | null)[]>([]);

  const isSel = (v: T) => (multiple ? (props.value as T[]).includes(v) : props.value === v);

  const activate = (v: T) => {
    if (props.multiple) {
      const cur = props.value;
      props.onChange(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
    } else {
      props.onChange(v);
    }
  };

  // Roving tabindex só se aplica ao single (radiogroup ARIA). No multi (checkbox group)
  // todos os tiles são tabbable e alternam com Espaço/Enter nativos do button.
  const activeIdx = multiple ? -1 : Math.max(0, options.findIndex((o) => isSel(o.value)));

  const move = (i: number) => {
    const n = options.length;
    const idx = ((i % n) + n) % n;
    btns.current[idx]?.focus();
    if (!multiple) activate(options[idx].value); // radiogroup: mover o foco também seleciona
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (multiple) return; // checkbox: Tab navega, Espaço/Enter alternam (nativo do button)
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': e.preventDefault(); move(i + 1); break;
      case 'ArrowLeft': case 'ArrowUp': e.preventDefault(); move(i - 1); break;
      case 'Home': e.preventDefault(); move(0); break;
      case 'End': e.preventDefault(); move(options.length - 1); break;
    }
  };

  const grid = (
    <div
      id={groupId}
      role={multiple ? 'group' : 'radiogroup'}
      aria-label={ariaLabel}
      className={['grid gap-2', columns === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3', label ? '' : className].join(' ')}
    >
      {options.map((opt, i) => {
        const Icon = opt.icon;
        return (
          <OptionTile
            key={opt.value}
            multiple={multiple}
            selected={isSel(opt.value)}
            label={opt.label}
            icon={Icon ? <Icon /> : undefined}
            fullSpan={opt.fullSpan}
            onClick={() => activate(opt.value)}
            tabIndex={multiple ? 0 : (i === activeIdx ? 0 : -1)}
            onKeyDown={(e) => onKeyDown(e, i)}
            buttonRef={(el) => { btns.current[i] = el; }}
          />
        );
      })}
    </div>
  );

  if (!label) return grid;
  return (
    <div className={['flex flex-col gap-2', className].join(' ')}>
      <span className="text-label font-medium text-fg-primary">{label}</span>
      {grid}
    </div>
  );
}
