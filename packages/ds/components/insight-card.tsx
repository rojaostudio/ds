export type InsightCardType = 'alert' | 'opportunity' | 'tip';

export interface InsightCardProps {
  type: InsightCardType;
  title: string;
  description: string;
  /** Optional numeric/text highlight, e.g. "+ R$ 450/mês" */
  potential?: string;
  /** CTA label */
  action?: string;
  /** CTA href — renders an <a> tag */
  actionHref?: string;
  /** CTA onClick — renders a <button> (takes precedence over actionHref when both provided) */
  actionOnClick?: () => void;
}

const TYPE_VARS: Record<InsightCardType, { card: string; badge: string }> = {
  alert:       { card: '[border-color:var(--insight-alert-border)] [background:var(--insight-alert-bg)]',       badge: '[background:var(--insight-alert-badge-bg)] [color:var(--insight-alert-badge-text)]' },
  opportunity: { card: '[border-color:var(--insight-opportunity-border)] [background:var(--insight-opportunity-bg)]', badge: '[background:var(--insight-opportunity-badge-bg)] [color:var(--insight-opportunity-badge-text)]' },
  tip:         { card: '[border-color:var(--insight-tip-border)] [background:var(--insight-tip-bg)]',           badge: '[background:var(--insight-tip-badge-bg)] [color:var(--insight-tip-badge-text)]' },
};

const TYPE_LABELS: Record<InsightCardType, string> = {
  alert:       'Atenção',
  opportunity: 'Oportunidade',
  tip:         'Dica',
};

export function InsightCard({
  type, title, description, potential, action, actionHref, actionOnClick,
}: InsightCardProps) {
  const v = TYPE_VARS[type];

  const ctaClass =
    'shrink-0 rounded-(--radius-card) px-3 py-1.5 text-caption font-medium whitespace-nowrap shadow-sm transition-colors ' +
    '[background:var(--insight-action-bg)] [border:1px_solid_var(--insight-action-border)] ' +
    '[color:var(--insight-action-text)] hover:[background:var(--insight-action-bg-hover)]';

  return (
    <div className={['rounded-(--radius-card) border p-4', v.card].join(' ')}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className={['inline-block text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5', v.badge].join(' ')}>
            {TYPE_LABELS[type]}
          </span>
          <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
            <p className="font-semibold text-label leading-tight [color:var(--insight-title-color)]">{title}</p>
            {potential && (
              <span className="text-caption font-medium tabular-nums [color:var(--insight-potential-color)]">{potential}</span>
            )}
          </div>
          <p className="mt-0.5 text-caption [color:var(--insight-description-color)]">{description}</p>
        </div>

        {action && (actionOnClick ? (
          <button type="button" onClick={actionOnClick} className={ctaClass}>
            {action}
          </button>
        ) : actionHref ? (
          <a href={actionHref} className={ctaClass}>
            {action}
          </a>
        ) : null)}
      </div>
    </div>
  );
}
