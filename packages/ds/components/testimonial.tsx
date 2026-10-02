'use client';

import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { BlockHeading } from './internal/block';
import { QuoteIcon } from './internal/icons';

export interface TestimonialProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  eyebrow?: ReactNode;
  /** The block's title, an h2 that names the section. */
  title: ReactNode;
  description?: ReactNode;
  /** TestimonialItem cards (Figma: slot `items`): 3 per row, one column below 640 of container width. */
  children: ReactNode;
}

/**
 * Testimonial — Figma [RDS] Blocks/Testimonial. Testimonials of a public page: only real ones, with the consent of
 * who said them. Adapts to the width of its container (Figma: `screen`). Styles: testimonial.css.
 */
export function Testimonial({ eyebrow, title, description, children, className, ...rest }: TestimonialProps) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} {...rest} className={['rds-block', 'rds-testimonial', className].filter(Boolean).join(' ')}>
      <div className="rds-block__inner">
        <BlockHeading eyebrow={eyebrow} title={title} description={description} titleId={titleId} />
        <ul className="rds-testimonial__items">{children}</ul>
      </div>
    </section>
  );
}

export interface TestimonialItemProps extends HTMLAttributes<HTMLLIElement> {
  /** The words of who said it (Figma: `quote`). */
  quote: ReactNode;
  /** Who said it (Figma: `name`). */
  name: ReactNode;
  /** Job title and company (Figma: `jobTitle`). */
  jobTitle?: ReactNode;
  /** An Avatar of the person (the Figma exposes it). */
  avatar?: ReactNode;
}

/** One testimonial card (Figma: .testimonial/item), a figure with the quote and its author. Only inside a Testimonial. */
export function TestimonialItem({ quote, name, jobTitle, avatar, className, ...rest }: TestimonialItemProps) {
  return (
    <li {...rest} className={['rds-testimonial__item', className].filter(Boolean).join(' ')}>
      <figure className="rds-testimonial__figure">
        <span className="rds-testimonial__mark" aria-hidden="true">
          <QuoteIcon />
        </span>
        <blockquote className="rds-testimonial__quote">{quote}</blockquote>
        <figcaption className="rds-testimonial__author">
          {avatar}
          <span className="rds-testimonial__byline">
            <span className="rds-testimonial__name">{name}</span>
            {jobTitle && <span className="rds-testimonial__role">{jobTitle}</span>}
          </span>
        </figcaption>
      </figure>
    </li>
  );
}
