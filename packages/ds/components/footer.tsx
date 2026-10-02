'use client';

import { Children, Fragment, isValidElement, useId, type HTMLAttributes, type ReactNode } from 'react';

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  /**
   * The brand (Figma: `logo`), always by slot: the design system carries no client logo. Usually a link to the home
   * page named after the brand, around the logotype.
   */
  logo: ReactNode;
  /** One sentence about the site (Figma: `tagline`). */
  tagline?: ReactNode;
  /** Links to the brand's profiles, each named, around a 24 mono icon (Figma: slot `social`). */
  social?: ReactNode;
  /** The accessible name of the list of profiles. */
  socialLabel?: string;
  /** FooterColumn, up to 4 (Figma: slot `columns`). */
  children?: ReactNode;
  /** The copyright line (Figma: `copyright`). */
  copyright: ReactNode;
}

/** The items of a slot as list items, opening a fragment (`<>…</>`) so each link gets its own `<li>`. */
function listItems(slot: ReactNode) {
  const items = isValidElement<{ children?: ReactNode }>(slot) && slot.type === Fragment ? slot.props.children : slot;
  return Children.map(items, (item) => item && <li>{item}</li>);
}

/**
 * Footer — Figma [RDS] Blocks/Footer. The footer of the public pages (<footer>, the contentinfo landmark at the top
 * level): brand, sentence and profiles, the link columns and the copyright. Below 640 of container width everything
 * stacks (Figma: `screen`). Styles: footer.css.
 */
export function Footer({ logo, tagline, social, socialLabel = 'Redes sociais', children, copyright, className, ...rest }: FooterProps) {
  return (
    <footer {...rest} className={['rds-footer', className].filter(Boolean).join(' ')}>
      <div className="rds-footer__inner">
        <div className="rds-footer__sitemap">
          <div className="rds-footer__brand">
            <div className="rds-footer__logo">{logo}</div>
            {tagline && <p className="rds-footer__tagline">{tagline}</p>}
            {social && (
              <ul className="rds-footer__social" aria-label={socialLabel}>
                {listItems(social)}
              </ul>
            )}
          </div>
          {children && <div className="rds-footer__columns">{children}</div>}
        </div>
        <p className="rds-footer__legal">{copyright}</p>
      </div>
    </footer>
  );
}

export interface FooterColumnProps extends HTMLAttributes<HTMLElement> {
  /** Who the links are for, such as customers or sellers (Figma: `title`). It names the column's navigation. */
  title: string;
  /** The links, `<a>` elements (Figma: slot `links`). */
  children: ReactNode;
}

/** A column of Footer links (Figma: .footer/column), a <nav> named by its title. Only inside a Footer. */
export function FooterColumn({ title, children, className, ...rest }: FooterColumnProps) {
  const id = useId();
  return (
    <nav aria-labelledby={id} {...rest} className={['rds-footer__column', className].filter(Boolean).join(' ')}>
      <p id={id} className="rds-footer__title">
        {title}
      </p>
      <ul className="rds-footer__links">{listItems(children)}</ul>
    </nav>
  );
}
