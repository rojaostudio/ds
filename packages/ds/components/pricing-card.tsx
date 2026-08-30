import { type ReactNode } from 'react';
import { Check } from 'lucide-react';

/**
 * PricingCard — cartão de plano para páginas de preço (marketing + billing).
 *
 * Props-based para casar com o shape de um catálogo (`/api/public/plans`):
 * nome, preço já formatado, lista de features e um slot de CTA (o consumidor
 * injeta o próprio link/botão — o DS não conhece roteamento nem analytics).
 *
 * `recommended` inverte a superfície (destaque) e mostra o selo de recomendação.
 * `badge` é um acento independente (ex.: "14 dias grátis") em outline.
 *
 *   <PricingCard
 *     name="Essencial" price="R$49,90" period="/mês"
 *     description="Para quem vende todo dia."
 *     features={['Produtos ilimitados', 'Controle de estoque']}
 *     recommended
 *     cta={<a href="/register">Começar</a>}
 *   />
 */
export interface PricingCardProps {
  name:        string;
  /** Preço já formatado pelo consumidor (ex.: "R$49,90", "R$0", "Grátis"). */
  price:       string;
  /** Sufixo do preço (ex.: "/mês"). Omitido em planos sem recorrência. */
  period?:     string;
  description?: string;
  features:    string[];
  /** Plano em destaque: superfície invertida + selo de recomendação. */
  recommended?: boolean;
  /** Texto do selo de recomendação. default = "Recomendado". */
  recommendedLabel?: string;
  /** Selo de acento independente do destaque (ex.: trial). Renderiza em outline. */
  badge?:      string;
  /** Slot do CTA — o consumidor injeta <a>/<Link>/<button> já estilizado ou nu. */
  cta:         ReactNode;
  className?:  string;
}

const CHECK_TONE = {
  recommended: 'text-brand-on-accent',
  default:     'text-brand-accent',
} as const;

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  recommended = false,
  recommendedLabel = 'Recomendado',
  badge,
  cta,
  className = '',
}: PricingCardProps) {
  const surface = recommended
    ? 'bg-surface-invert text-fg-inverse border border-transparent'
    : 'bg-surface-default text-fg-primary border border-stroke-default';
  const nameTone = recommended ? 'text-fg-inverse/70' : 'text-fg-muted';
  const descTone = recommended ? 'text-fg-inverse/70' : 'text-fg-muted';
  const periodTone = recommended ? 'text-fg-inverse/60' : 'text-fg-muted';
  const featTone = recommended ? 'text-fg-inverse/85' : 'text-fg-secondary';
  const check = recommended ? CHECK_TONE.recommended : CHECK_TONE.default;

  return (
    <div className={`relative flex flex-col rounded-(--radius-card) p-6 ${surface} ${className}`}>
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-(--radius-badge) bg-brand-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-on-accent">
          {recommendedLabel}
        </span>
      )}
      {badge && (
        <span className="absolute -top-3 right-4 whitespace-nowrap rounded-(--radius-badge) border border-brand-accent bg-surface-default px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-accent">
          {badge}
        </span>
      )}

      <p className={`text-caption font-semibold uppercase tracking-widest ${nameTone}`}>{name}</p>

      <div className="mt-3 mb-1 flex items-baseline gap-1">
        <span className="text-4xl font-bold leading-none tracking-tight tabular-nums">{price}</span>
        {period && <span className={`text-caption ${periodTone}`}>{period}</span>}
      </div>

      {description && <p className={`mb-5 min-h-10 text-caption ${descTone}`}>{description}</p>}

      <div className="mt-1">{cta}</div>

      <ul className="mt-5 space-y-2">
        {features.map((f) => (
          <li key={f} className={`flex items-start gap-2 text-caption ${featTone}`}>
            <Check size={14} className={`mt-0.5 shrink-0 ${check}`} aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
