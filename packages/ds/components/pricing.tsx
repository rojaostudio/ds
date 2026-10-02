'use client';

import { Children, useId, type HTMLAttributes, type ReactNode } from 'react';
import { Badge } from './badge';
import { BlockHeading } from './internal/block';
import { CheckIcon } from './internal/icons';

export interface PricingProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** A short label above the title (Figma: `eyebrow`). */
  eyebrow?: ReactNode;
  /** The block's title, an h2 that names the section (Figma: `title`). */
  title: ReactNode;
  description?: ReactNode;
  /** The PricingPlans (Figma: slot `plans`): side by side, stacked below 640 of container width. */
  children: ReactNode;
}

/**
 * Pricing — Figma [RDS] Blocks/Pricing. The pricing block of a public page: label, title, a sentence and the plans,
 * one of them recommended. Adapts to the width of its container (Figma: `screen`). Styles: pricing.css.
 */
export function Pricing({ eyebrow, title, description, children, className, ...rest }: PricingProps) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} {...rest} className={['rds-block', 'rds-pricing', className].filter(Boolean).join(' ')}>
      <div className="rds-block__inner">
        <BlockHeading eyebrow={eyebrow} title={title} description={description} titleId={titleId} />
        <ul className="rds-pricing__plans">
          {Children.toArray(children).map((plan, i) => (
            <li key={i} className="rds-pricing__slot">
              {plan}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export interface PricingPlanProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The plan's name, an h3 shown in capitals (Figma: `name`). */
  name: ReactNode;
  /** The price, already formatted by the caller (Figma: `price`): "R$ 49,90", "Grátis". */
  price: ReactNode;
  /** After the price (Figma: `showPeriod` + `period`): "/mês". */
  period?: ReactNode;
  /** Who it is for (Figma: `showDescription` + `description`). */
  description?: ReactNode;
  /** What it includes, with a check each (Figma: `feature1`…`feature5`). Up to five reads best. */
  features?: ReactNode[];
  /**
   * The highlighted plan (Figma: `recommended`): the surface inverts and the badge shows, half out of the top. One per
   * Pricing.
   */
  recommended?: boolean;
  /** The badge's text when recommended. */
  recommendedLabel?: ReactNode;
  /**
   * The call to action (Figma: the exposed Button): a Button, a link through asChild. The Figma uses tone="action"
   * variant="outline" on a plain plan and tone="inverse" on the recommended one.
   */
  cta?: ReactNode;
}

/**
 * PricingPlan — Figma [RDS] Blocks/.pricing/plan. The card of one plan: name, price and period, the sentence, the
 * call to action and the list of features. Inside a Pricing, or alone. Styles: pricing.css.
 */
export function PricingPlan({
  name,
  price,
  period,
  description,
  features = [],
  recommended = false,
  recommendedLabel = 'Recomendado',
  cta,
  className,
  ...rest
}: PricingPlanProps) {
  return (
    <div {...rest} className={['rds-pricing-plan', recommended && 'rds-pricing-plan--recommended', className].filter(Boolean).join(' ')}>
      {recommended && (
        <Badge tone="accent" className="rds-pricing-plan__badge">
          {recommendedLabel}
        </Badge>
      )}
      <div className="rds-pricing-plan__header">
        <h3 className="rds-pricing-plan__name">{name}</h3>
        <div className="rds-pricing-plan__price-block">
          <p className="rds-pricing-plan__price-row">
            <span className="rds-pricing-plan__price">{price}</span>
            {period && <span className="rds-pricing-plan__period">{period}</span>}
          </p>
          {description && <p className="rds-pricing-plan__description">{description}</p>}
        </div>
      </div>
      {cta && <div className="rds-pricing-plan__cta">{cta}</div>}
      {features.length > 0 && (
        <ul className="rds-pricing-plan__features">
          {features.map((feature, i) => (
            <li key={i} className="rds-pricing-plan__feature">
              <span className="rds-pricing-plan__check" aria-hidden="true">
                <CheckIcon />
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
