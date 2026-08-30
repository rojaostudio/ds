import { Lock, AlertTriangle } from 'lucide-react';
import type { ReactNode, ComponentType } from 'react';

/**
 * PaywallBanner — gate de feature/plano. Diferente do BlockerCard que sinaliza
 * problema (limite, falha), o PaywallBanner aponta pra um upgrade ou ação de plano.
 *
 * Uso:
 *   <PaywallBanner
 *     variant="warn"
 *     title="Você está em 80% do limite"
 *     description="Faça upgrade pra continuar cadastrando produtos."
 *     ctaLabel="Ver planos"
 *     ctaHref="/billing"
 *   />
 *
 *   <PaywallBanner variant="blocked" title="..." description="..." />
 */

export interface PaywallBannerProps {
  variant:      'warn' | 'blocked';
  title:        string;
  description:  ReactNode;
  ctaLabel?:    string;
  ctaHref?:     string;
  /** Handler alternativo (sem href). */
  onCta?:       () => void;
  /** Component de link (next/link em apps Next). */
  linkAs?:      ComponentType<{ href: string; className?: string; children: ReactNode }>;
  className?:   string;
}

const STYLES = {
  warn: {
    container: 'border-warning-border bg-warning-soft',
    title:     'text-warning-text',
    desc:      'text-warning-text/85',
    cta:       'bg-surface-default border border-warning-border hover:bg-warning-soft text-warning-text',
    Icon:      AlertTriangle,
    iconColor: 'text-warning-text',
  },
  blocked: {
    container: 'border-danger-border bg-danger-soft',
    title:     'text-danger-text',
    desc:      'text-danger-text/85',
    cta:       'bg-danger text-fg-inverse hover:bg-danger-text',
    Icon:      Lock,
    iconColor: 'text-danger-text',
  },
} as const;

function DefaultLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return <a href={href} className={className}>{children}</a>;
}

export function PaywallBanner({
  variant,
  title,
  description,
  ctaLabel = 'Ver planos',
  ctaHref,
  onCta,
  linkAs: LinkAs = DefaultLink,
  className = '',
}: PaywallBannerProps) {
  const s = STYLES[variant];
  const Icon = s.Icon;
  const ctaClass = ['text-caption font-semibold px-3 py-1.5 rounded-(--radius-card) shrink-0 transition-colors', s.cta].join(' ');

  const cta = ctaHref ? (
    <LinkAs href={ctaHref} className={ctaClass}>{ctaLabel} →</LinkAs>
  ) : onCta ? (
    <button type="button" onClick={onCta} className={ctaClass}>{ctaLabel} →</button>
  ) : null;

  return (
    <div className={['rounded-(--radius-card) border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2', s.container, className].join(' ')}>
      <div className="flex items-start gap-2.5 min-w-0">
        <Icon size={18} className={['shrink-0 mt-0.5', s.iconColor].join(' ')} />
        <div className="min-w-0">
          <p className={['text-label font-semibold', s.title].join(' ')}>{title}</p>
          <div className={['text-caption mt-0.5', s.desc].join(' ')}>{description}</div>
        </div>
      </div>
      {cta}
    </div>
  );
}
