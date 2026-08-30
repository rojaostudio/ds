'use client';

import type { ReactNode } from 'react';
import { Check, ChevronRight } from 'lucide-react';

/**
 * SelectableCard — cartão CLICÁVEL genérico (tile de ação OU escolha).
 *
 * Resolve os "card-as-div" reimplementados como `<button className="rounded-xl border">`:
 * tiles de ação (abrir modal, navegar), cards de escolha, pricing card (com ribbon).
 * Renderiza `<button>` (ação) ou `<a>` (navegação) — semântica correta, foco acessível.
 *
 * Estado `selected` usa destaque NEUTRO (border-focus + surface-raised) — NÃO usa brand,
 * então é seguro no admin (onde cor de marca é proibida) e na vitrine.
 *
 * indicator:
 *   'radio'   — bolinha de seleção (escolha exclusiva)
 *   'check'   — check quando selecionado (multi-seleção/confirmação)
 *   'chevron' — seta de navegação (tile que leva a outra tela)
 *   'none'    — sem indicador (tile de ação puro)
 */
export interface SelectableCardProps {
  selected?: boolean;
  onClick?: () => void;
  /** Elemento renderizado: 'button' (ação, default) ou 'a' (navegação). */
  as?: 'button' | 'a';
  href?: string;
  indicator?: 'radio' | 'check' | 'chevron' | 'none';
  /** Selo flutuante no topo (ex: "Mais popular" no pricing card). */
  ribbon?: ReactNode;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function SelectableCard({
  selected = false,
  onClick,
  as = 'button',
  href,
  indicator = 'none',
  ribbon,
  disabled = false,
  className = '',
  children,
}: SelectableCardProps) {
  const base =
    'relative w-full flex items-center gap-4 px-4 py-4 rounded-(--radius-card) border text-left transition-all ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus';
  const state = selected
    ? 'border-2 border-stroke-focus bg-surface-raised'
    : 'border border-stroke-default bg-surface-default hover:border-stroke-strong';
  const disabledCls = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer';
  const cls = [base, state, disabledCls, className].filter(Boolean).join(' ');

  const inner = (
    <>
      {ribbon && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2">{ribbon}</span>
      )}
      <div className="flex-1 min-w-0">{children}</div>
      {indicator === 'radio' && (
        <span className={`shrink-0 size-4 rounded-full border-2 flex items-center justify-center ${selected ? 'border-stroke-focus' : 'border-stroke-strong'}`}>
          {selected && <span className="size-2 rounded-full bg-stroke-focus" />}
        </span>
      )}
      {indicator === 'check' && selected && (
        <Check className="shrink-0 size-4 text-fg-primary" strokeWidth={2.5} />
      )}
      {indicator === 'chevron' && (
        <ChevronRight className="shrink-0 size-4 text-fg-muted" strokeWidth={2} />
      )}
    </>
  );

  if (as === 'a') {
    return (
      <a href={href} className={cls} aria-disabled={disabled || undefined} aria-current={selected || undefined}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={selected} className={cls}>
      {inner}
    </button>
  );
}
