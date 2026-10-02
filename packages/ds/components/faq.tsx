'use client';

import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { BlockHeading } from './internal/block';

export interface FAQProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  eyebrow?: ReactNode;
  /** The block's title, an h2 that names the section. */
  title: ReactNode;
  /** The Accordion with the questions (the Figma exposes it). Its items' titles are h3. */
  children: ReactNode;
  /** The support line (Figma: `showSupport` + `supportText`). */
  supportText?: ReactNode;
  /** The way to support: an action ghost Button, or a link through asChild. */
  supportAction?: ReactNode;
}

/**
 * FAQ — Figma [RDS] Blocks/FAQ. The frequent questions of a public page, in an Accordion, and the way to support.
 * Adapts to the width of its container (Figma: `screen`). Styles: faq.css.
 */
export function FAQ({ eyebrow, title, children, supportText, supportAction, className, ...rest }: FAQProps) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} {...rest} className={['rds-block', 'rds-faq', className].filter(Boolean).join(' ')}>
      <div className="rds-block__inner">
        <BlockHeading eyebrow={eyebrow} title={title} titleId={titleId} />
        <div className="rds-faq__questions">{children}</div>
        {(supportText || supportAction) && (
          <div className="rds-faq__support">
            {supportText && <p className="rds-faq__support-text">{supportText}</p>}
            {supportAction}
          </div>
        )}
      </div>
    </section>
  );
}
