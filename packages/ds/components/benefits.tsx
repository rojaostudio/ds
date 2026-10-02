'use client';

import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { BlockHeading } from './internal/block';

export interface BenefitsProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** A short label above the title (Figma: `eyebrow`). */
  eyebrow?: ReactNode;
  /** The block's title, an h2 that names the section (Figma: `title`). */
  title: ReactNode;
  description?: ReactNode;
  /** 3 to 6 BenefitsItem (Figma: slot `items`): 3 per row, one column below 640 of container width. */
  children: ReactNode;
}

/**
 * Benefits — Figma [RDS] Blocks/Benefits. The benefits of a public page: label, title, a sentence and a grid of
 * reasons to use the product. Adapts to the width of its container (Figma: `screen`). Styles: benefits.css.
 */
export function Benefits({ eyebrow, title, description, children, className, ...rest }: BenefitsProps) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} {...rest} className={['rds-block', 'rds-benefits', className].filter(Boolean).join(' ')}>
      <div className="rds-block__inner">
        <BlockHeading eyebrow={eyebrow} title={title} description={description} titleId={titleId} />
        <ul className="rds-benefits__items">{children}</ul>
      </div>
    </section>
  );
}

export interface BenefitsItemProps extends Omit<HTMLAttributes<HTMLLIElement>, 'title'> {
  /** Decorative, in the 40 plate (Figma: `icon`). */
  icon: ReactNode;
  /** An h3 (Figma: `title`). */
  title: ReactNode;
  description: ReactNode;
  /** An action ghost Button, a link through asChild (Figma: `showLink`). */
  link?: ReactNode;
}

/** One card of the Benefits (Figma: .benefits/item). Only inside a Benefits. */
export function BenefitsItem({ icon, title, description, link, className, ...rest }: BenefitsItemProps) {
  return (
    <li {...rest} className={['rds-benefits__item', className].filter(Boolean).join(' ')}>
      <span className="rds-benefits__icon" aria-hidden="true">
        {icon}
      </span>
      <div className="rds-benefits__text">
        <h3 className="rds-benefits__item-title">{title}</h3>
        <p className="rds-benefits__item-description">{description}</p>
      </div>
      {link && <div className="rds-benefits__link">{link}</div>}
    </li>
  );
}
