/**
 * Chip — pill interativo com 4 modos implícitos pelas props:
 *
 *   <Chip onClick={fn}>Ação</Chip>                              — assist padrão
 *   <Chip subtle onClick={fn}>Ação discreta</Chip>              — assist sutil
 *   <Chip onRemove={fn}>tag</Chip>                              — input (botão X)
 *   <Chip selected onRemove={fn}>tag ativa</Chip>               — input selecionado
 *   <Chip highlight leading={<Sparkles />} onClick={fn}>IA</Chip> — suggestion
 */

import type { ReactNode, MouseEvent, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

export interface ChipProps {
  children:   ReactNode;
  onClick?:   (e: MouseEvent<HTMLButtonElement | HTMLDivElement>) => void;
  /** Leading slot — ícone, avatar, qualquer ReactNode. */
  leading?:   ReactNode;
  disabled?:  boolean;
  className?: string;
  /** Sem borda, background discreto. */
  subtle?:    boolean;
  /** Destaca com cor primária. Usado com onRemove. */
  selected?:  boolean;
  /** Exibe botão X de remover. Implica estrutura de div (não button). */
  onRemove?:  () => void;
  /** Border tracejado + brand-secondary. Sinaliza sugestão de IA. */
  highlight?: boolean;
}

const BASE =
  'inline-flex items-center gap-1.5 px-3 h-7 text-caption font-medium rounded-full border transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

export function Chip({
  children,
  onClick,
  leading,
  disabled  = false,
  className = '',
  subtle    = false,
  selected  = false,
  onRemove,
  highlight = false,
}: ChipProps) {

  // Input — precisa de <div> para conter o <button> X sem violar HTML
  if (onRemove !== undefined || selected) {
    const interactive = !!onClick;

    function handleKey(e: KeyboardEvent<HTMLDivElement>) {
      if (!interactive) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.(e as unknown as MouseEvent<HTMLDivElement>);
      }
    }

    return (
      <div
        role={interactive ? 'button' : undefined}
        tabIndex={interactive && !disabled ? 0 : undefined}
        onClick={disabled ? undefined : onClick}
        onKeyDown={handleKey}
        className={[
          BASE,
          onRemove ? 'pr-1.5' : '',
          selected
            ? 'border-brand-primary bg-brand-primary text-brand-on-primary'
            : 'border-stroke-default bg-surface-default text-fg-primary',
          interactive && !disabled ? 'cursor-pointer hover:bg-surface-raised' : '',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          className,
        ].join(' ')}
      >
        {leading && <span className="shrink-0 [&_svg]:size-3.5">{leading}</span>}
        <span className="truncate">{children}</span>
        {onRemove && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onRemove(); }}
            aria-label="Remover"
            disabled={disabled}
            className="inline-flex items-center justify-center size-4 rounded-full opacity-60 hover:opacity-100 ml-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus transition-opacity"
          >
            <X size={12} />
          </button>
        )}
      </div>
    );
  }

  // Suggestion — highlight implica border tracejado + brand-secondary
  if (highlight) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={[
          BASE,
          'border-dashed border-brand-secondary bg-brand-secondary/10 text-brand-secondary hover:bg-brand-secondary/20',
          className,
        ].join(' ')}
      >
        {leading && <span className="shrink-0 [&_svg]:size-3.5">{leading}</span>}
        {children}
      </button>
    );
  }

  // Assist — padrão e subtle
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        BASE,
        subtle
          ? 'border-transparent bg-surface-raised text-fg-secondary hover:bg-stroke-default hover:text-fg-primary'
          : 'border-stroke-default bg-surface-default text-fg-primary hover:bg-surface-raised',
        className,
      ].join(' ')}
    >
      {leading && <span className="shrink-0 [&_svg]:size-3.5">{leading}</span>}
      {children}
    </button>
  );
}
