import type { ComponentType, HTMLAttributes, ReactNode } from 'react';

export type InsightCardType = 'alert' | 'opportunity' | 'tip';

export interface InsightCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The kind of message: it gives the colour and the tag (Atenção, Oportunidade, Dica). */
  type: InsightCardType;
  /** What the system noticed, in one line (Figma: `title`). */
  title: ReactNode;
  /** Why it matters or what to do (Figma: `description`). */
  description: ReactNode;
  /** A number or short highlight beside the title (Figma: `hasPotential` + `potential`): "+ R$ 450/mês". */
  potential?: ReactNode;
  /** The action's text (Figma: `hasAction` + `action`). Rendered with `actionHref` (a link) or `actionOnClick`. */
  action?: string;
  /** Where the action leads: renders a link (`linkAs`, or a plain <a>). */
  actionHref?: string;
  /** What the action does: renders a button. Takes precedence over `actionHref`. */
  actionOnClick?: () => void;
  /** The link component for `actionHref` (a framework Link). Default: a plain <a>. */
  linkAs?: ComponentType<{ href: string; className?: string; children: ReactNode }>;
  /** The heading level that fits the page's heading order. */
  titleAs?: 'h2' | 'h3' | 'h4';
}

const LABELS: Record<InsightCardType, string> = {
  alert: 'Atenção',
  opportunity: 'Oportunidade',
  tip: 'Dica',
};

function DefaultLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

/**
 * InsightCard — Figma [RDS] Content/InsightCard. A note from the system about the business: an alert, an
 * opportunity or a tip, with what to do. Styles: insight-card.css.
 */
export function InsightCard({
  type,
  title,
  description,
  potential,
  action,
  actionHref,
  actionOnClick,
  linkAs: LinkAs = DefaultLink,
  titleAs: Title = 'h3',
  className,
  ...rest
}: InsightCardProps) {
  return (
    <article {...rest} className={['rds-insight-card', `rds-insight-card--${type}`, className].filter(Boolean).join(' ')}>
      <div className="rds-insight-card__body">
        <span className="rds-insight-card__badge">{LABELS[type]}</span>
        <div className="rds-insight-card__head">
          <Title className="rds-insight-card__title">{title}</Title>
          {potential && <span className="rds-insight-card__potential">{potential}</span>}
        </div>
        <p className="rds-insight-card__description">{description}</p>
      </div>
      {action &&
        (actionOnClick ? (
          <button type="button" className="rds-insight-card__action" onClick={actionOnClick}>
            {action}
          </button>
        ) : actionHref ? (
          <LinkAs href={actionHref} className="rds-insight-card__action">
            {action}
          </LinkAs>
        ) : null)}
    </article>
  );
}
