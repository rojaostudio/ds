'use client';

import type { ComponentType, ReactNode } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { ICON_MAP, type EmptyStateIcon } from './empty-state';
import { Modal } from './modal';

// Paywall unificado (#372) — uma fonte de verdade visual para "faça upgrade".
// Apresentação PURA: não conhece `can()` nem o plano do usuário; o app injeta
// ícone/copy/plano via props (data-driven por FEATURE_META). RN-safe: nada de
// next/* dentro — navegação via `linkAs` (web) ou `onCta` (app).

// 'trial_value' (#405) — reverse trial: a feature está LIBERADA, a modal só EDUCA que é
// Pro (tom de valor, pós-uso). Sem cadeado — selo positivo âmbar, liga visualmente à strip.
export type PaywallReason = 'feature' | 'limit' | 'trial_value';

type LinkComponent = ComponentType<{
  href: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}>;

export interface PaywallContentProps {
  /** Ícone por categoria da feature (catalog/channels/commercial/operation/
   *  intelligence/billing). Default: lock. */
  icon?: EmptyStateIcon;
  title: string;
  description?: string;
  /** 'feature' → "Disponível no {planLabel}"; 'limit' → "Limite atingido".
   *  Sem cor de alerta — friendly, não erro. */
  reason?: PaywallReason;
  /** Rótulo do plano mínimo (ex.: "Essencial") — usado quando reason='feature'. */
  planLabel?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
  /** Componente de link do app (next/link). Sem ele → âncora nativa <a>. */
  linkAs?: LinkComponent;
}

// Botão "Ver planos": preto (brand-primary), contraste AAA. 48px (h-control-lg
// não é garantido em todos os temas → py explícito).
const CTA_CLASS =
  'inline-flex items-center justify-center w-full rounded-(--radius-control) px-4 py-3 ' +
  'text-label font-semibold bg-brand-primary text-brand-on-primary hover:bg-brand-hover transition-colors';

function planLineText(reason: PaywallReason, planLabel?: string): string {
  if (reason === 'trial_value') return 'Incluso no seu teste Pro';
  if (reason === 'limit') return 'Limite atingido';
  return planLabel ? `Disponível no ${planLabel}` : 'Faça upgrade';
}

/** Visual puro do paywall — compartilhado por PaywallState e PaywallModal. */
export function PaywallContent({
  icon = 'lock',
  title,
  description,
  reason = 'feature',
  planLabel,
  ctaLabel = 'Ver planos',
  ctaHref,
  onCta,
  linkAs: Link,
}: PaywallContentProps) {
  const Icon = ICON_MAP[icon] ?? Lock;
  const isTrial = reason === 'trial_value';

  const cta = ctaHref && Link ? (
    <Link href={ctaHref} className={CTA_CLASS} onClick={onCta}>{ctaLabel}</Link>
  ) : ctaHref ? (
    <a href={ctaHref} className={CTA_CLASS} onClick={onCta}>{ctaLabel}</a>
  ) : (
    <button type="button" className={CTA_CLASS} onClick={onCta}>{ctaLabel}</button>
  );

  return (
    <div className="flex flex-col items-center text-center px-2">
      {/* Ícone da feature + selo. No paywall: cadeado (bloqueado). No trial: faísca âmbar
          (você TEM, aproveite) — nunca cadeado. Ícone em fg-secondary (NUNCA disabled). */}
      <div className="relative mb-4 text-fg-secondary">
        <Icon size={52} strokeWidth={1.25} />
        <span className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full ${isTrial ? 'bg-amber-500 text-white' : 'bg-brand-primary text-brand-on-primary'}`}>
          {isTrial ? <Sparkles size={12} strokeWidth={2.5} /> : <Lock size={12} strokeWidth={2.5} />}
        </span>
      </div>

      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-caption font-medium ${isTrial ? 'bg-amber-100 text-amber-900' : 'bg-surface-raised text-fg-secondary'}`}>
        {planLineText(reason, planLabel)}
      </span>

      <p className="text-body font-semibold text-fg-primary mt-3 mb-1.5">{title}</p>
      {description && (
        <p className="text-label text-fg-muted max-w-sm leading-relaxed mb-5">{description}</p>
      )}

      <div className="w-full max-w-xs">{cta}</div>
    </div>
  );
}

// ── PaywallState — gate de seção inteira (Financeiro, Relatórios) ──────────────

export interface PaywallStateProps extends PaywallContentProps {
  className?: string;
}

/** Estado-de-página: ocupa a altura disponível, mesmo visual do modal. */
export function PaywallState({ className = '', ...content }: PaywallStateProps) {
  return (
    <div
      className={['flex flex-col items-center justify-center min-h-[320px] flex-1 py-10', className]
        .filter(Boolean)
        .join(' ')}
    >
      <PaywallContent {...content} />
    </div>
  );
}

// ── PaywallModal — gate de ação (toggle, adicionar membro, domínio, tema) ──────

export interface PaywallModalProps extends PaywallContentProps {
  open: boolean;
  onClose: () => void;
}

/** Modal compacto: o controle de ação fica visível na tela; ao clicar, abre isto. */
export function PaywallModal({ open, onClose, ...content }: PaywallModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="py-2">
        <PaywallContent {...content} onCta={() => { content.onCta?.(); onClose(); }} />
      </div>
    </Modal>
  );
}
