'use client';

import { useState, useEffect } from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, Lock, X } from 'lucide-react';
import type { ReactNode, ComponentType } from 'react';

/**
 * Notice — aviso contextual com escala de SEVERIDADE real. Unifica a linguagem visual
 * que antes estava fatiada por ORIGEM (CopilotHint cinza vs PaywallBanner vermelho),
 * o que invertia a hierarquia: o aviso mais grave (operacional) ficava no componente
 * mais discreto. Aqui a cor segue a gravidade, não quem emitiu.
 *
 * Dois eixos ortogonais:
 *  - `severity` (perceptual): info | success | warning | critical → cor/ícone/peso.
 *  - `intent` (semântico): operational | commercial → só troca o ícone default
 *    (commercial = cadeado de plano) e a telemetria; NÃO muda a cor.
 *
 * Regra de severidade = CUSTO DE IGNORAR, não a fonte. "Loja não recebe pedidos"
 * (trava a venda) é `critical`; "limite do plano" (a loja segue vendendo) é `warning`.
 *
 * Consome só a família semântica de feedback (danger/warning/info/success) do base.css
 * — zero cor hardcoded. Acessível: role/aria-live por severidade + ícone (cor nunca é
 * o único canal). Crítico é não-dispensável por definição.
 */

export type NoticeSeverity = 'info' | 'success' | 'warning' | 'critical';
export type NoticeIntent = 'operational' | 'commercial';

export interface NoticeProps {
  severity: NoticeSeverity;
  title: string;
  description?: ReactNode;
  intent?: NoticeIntent;
  cta?: { label: string; href?: string; onClick?: () => void };
  /** Component de link (next/link em apps Next). */
  linkAs?: ComponentType<{ href: string; className?: string; children: ReactNode }>;
  /** Dispensável: ignorado quando severity='critical' (crítico nunca some). Precisa de `id`. */
  dismissible?: boolean;
  /** Chave de dispensa (localStorage). Re-key pela condição (ex: `zeroStock:7`) pra reaparecer quando piora. */
  id?: string;
  /** aria-label do botão dispensar (i18n pelo caller). */
  dismissLabel?: string;
  className?: string;
}

const STYLES: Record<NoticeSeverity, {
  container: string; title: string; desc: string; icon: string; cta: string; solidCta: boolean;
}> = {
  critical: {
    container: 'border-danger-border bg-danger-soft',
    title: 'text-danger-text', desc: 'text-danger-text/85', icon: 'text-danger-text',
    cta: 'bg-danger text-fg-inverse hover:bg-danger-text', solidCta: true,
  },
  warning: {
    container: 'border-warning-border bg-warning-soft',
    title: 'text-warning-text', desc: 'text-warning-text/85', icon: 'text-warning-text',
    cta: 'bg-surface-default border border-warning-border hover:bg-warning-soft text-warning-text', solidCta: false,
  },
  info: {
    container: 'border-info-border bg-info-soft',
    title: 'text-info-text', desc: 'text-info-text/85', icon: 'text-info-text',
    cta: 'bg-surface-default border border-info-border hover:bg-info-soft text-info-text', solidCta: false,
  },
  success: {
    container: 'border-success-border bg-success-soft',
    title: 'text-success-text', desc: 'text-success-text/85', icon: 'text-success-text',
    cta: 'bg-surface-default border border-success-border hover:bg-success-soft text-success-text', solidCta: false,
  },
};

function iconFor(severity: NoticeSeverity, intent: NoticeIntent) {
  if (intent === 'commercial' && (severity === 'critical' || severity === 'warning')) return Lock;
  switch (severity) {
    case 'critical': return AlertOctagon;
    case 'warning':  return AlertTriangle;
    case 'success':  return CheckCircle2;
    default:         return Info;
  }
}

function DefaultLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return <a href={href} className={className}>{children}</a>;
}

export function Notice({
  severity,
  title,
  description,
  intent = 'operational',
  cta,
  linkAs: LinkAs = DefaultLink,
  dismissible = false,
  id,
  dismissLabel = 'Dispensar',
  className = '',
}: NoticeProps) {
  // Crítico nunca é dispensável (custo de ignorar é alto demais). Precisa de id pra persistir.
  const canDismiss = dismissible && severity !== 'critical' && !!id;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (canDismiss && id) setDismissed(localStorage.getItem(`notice-dismissed:${id}`) === '1');
  }, [canDismiss, id]);

  if (dismissed) return null;

  const s = STYLES[severity];
  const Icon = iconFor(severity, intent);
  const ctaClass = ['text-caption font-semibold px-3 py-1.5 rounded-(--radius-card) shrink-0 transition-colors', s.cta].join(' ');

  function dismiss() {
    if (id) localStorage.setItem(`notice-dismissed:${id}`, '1');
    setDismissed(true);
  }

  const ctaNode = cta?.href ? (
    <LinkAs href={cta.href} className={ctaClass}>{cta.label} →</LinkAs>
  ) : cta?.onClick ? (
    <button type="button" onClick={cta.onClick} className={ctaClass}>{cta.label} →</button>
  ) : null;

  return (
    <div
      role={severity === 'critical' ? 'alert' : 'status'}
      aria-live={severity === 'critical' ? 'assertive' : 'polite'}
      className={['rounded-(--radius-card) border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2', s.container, className].join(' ')}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <Icon size={18} aria-hidden className={['shrink-0 mt-0.5', s.icon].join(' ')} />
        <div className="min-w-0">
          <p className={['text-label font-semibold', s.title].join(' ')}>{title}</p>
          {description && <div className={['text-caption mt-0.5', s.desc].join(' ')}>{description}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        {ctaNode}
        {canDismiss && (
          <button
            type="button"
            onClick={dismiss}
            aria-label={dismissLabel}
            className={['transition-opacity hover:opacity-70 shrink-0', s.icon].join(' ')}
          >
            <X size={16} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
