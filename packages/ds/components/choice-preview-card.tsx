'use client';

import type { ReactNode } from 'react';
import { Check, Lock } from 'lucide-react';

/**
 * ChoicePreviewCard — cartão de seleção VERTICAL: mini-preview (mockup/swatch/imagem) em
 * cima, label + descrição embaixo, check no selecionado. Para escolhas onde o rótulo não
 * basta e o usuário precisa VER a opção (layout da home, tema, densidade, modo).
 *
 * Quando usar cada "card clicável" do DS:
 *   - ChoicePreviewCard — tile VERTICAL de preview selecionável (este).
 *   - ChoiceCard        — row HORIZONTAL com radio (escolha exclusiva textual).
 *   - SelectableCard    — clicável genérico (ação/navegação), button/a.
 *   - ToggleCard        — toggle dentro de card.
 *   - MediaTile         — thumbnail de navegação (sem estado selecionado).
 *
 * Estado selected é NEUTRO (stroke-focus), seguro no admin. A seleção única é gerenciada
 * pelo consumidor (map + selected/onSelect) — sem grupo no DS de propósito.
 */
export interface ChoicePreviewCardProps {
  selected: boolean;
  onSelect: () => void;
  /** Mini-mockup/swatch/imagem no topo. */
  preview: ReactNode;
  label: string;
  description?: string;
  /** Bloqueado por gate de plano — mostra cadeado; o clique segue (consumidor abre paywall). */
  locked?: boolean;
  /** Desabilitado (não-clicável). */
  disabled?: boolean;
  /** Selo no canto do preview (ex.: "PRO"). */
  badge?: ReactNode;
  previewAspect?: 'square' | 'video' | 'wide';
  className?: string;
}

export function ChoicePreviewCard({
  selected,
  onSelect,
  preview,
  label,
  description,
  locked = false,
  disabled = false,
  badge,
  previewAspect = 'video',
  className = '',
}: ChoicePreviewCardProps) {
  const aspect =
    previewAspect === 'square' ? 'aspect-square' : previewAspect === 'wide' ? 'aspect-[2/1]' : 'aspect-video';

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={[
        'relative w-full text-left rounded-(--radius-card) border p-2 transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus',
        selected
          ? 'border-2 border-stroke-focus bg-surface-raised'
          : 'border border-stroke-default bg-surface-default hover:border-stroke-strong',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* ring-inset no preview pra swatch claro não sumir no fundo do card */}
      <div className={['relative w-full overflow-hidden rounded-(--radius-card) ring-1 ring-inset ring-stroke-subtle', aspect].join(' ')}>
        {preview}
        {badge && <span className="absolute top-1.5 left-1.5">{badge}</span>}
        {selected && (
          <span className="absolute bottom-1.5 right-1.5 size-5 rounded-full bg-stroke-focus text-surface-default flex items-center justify-center">
            <Check size={12} strokeWidth={3} />
          </span>
        )}
        {locked && (
          // TODO(DS): trocar por token de overlay (--choice-preview-overlay) — Patrick.
          <span className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.55)]">
            <Lock size={18} className="text-white" />
          </span>
        )}
      </div>
      <div className="px-1 pt-2">
        <div className="text-sm font-medium text-fg-primary">{label}</div>
        {description && <div className="text-xs text-fg-muted mt-0.5 leading-snug">{description}</div>}
      </div>
    </button>
  );
}
