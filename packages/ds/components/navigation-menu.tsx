'use client';

import type { ComponentPropsWithRef, ComponentType, ReactNode } from 'react';
import * as Nav from '@radix-ui/react-navigation-menu';
import { ChevronDownIcon } from './internal/icons';

export interface NavigationMenuLink {
  /** The link's name (Figma: .navmenu/link `title`). */
  title: string;
  /** One short phrase under the title (Figma: `showDescription` + `description`). */
  description?: string;
  href: string;
}

/** A section: a label that opens a panel of links (Figma: .navmenu/trigger), or a plain link. */
export type NavigationMenuEntry = { label: string; links: NavigationMenuLink[] } | { label: string; href: string };

/** A link component that spreads the props it gets onto its element (Next's `Link` does). */
export type NavigationMenuLinkComponent = ComponentType<{ href: string; className?: string; children: ReactNode }>;

export interface NavigationMenuProps {
  /** The sections, in order (Figma: the `items` slot). A panel holds up to eight links (Figma: the `links` slot). */
  items: NavigationMenuEntry[];
  /** The nav's name ("Principal"). */
  'aria-label': string;
  /** The link element (default `<a>`). Pass a framework Link (Next's `Link`) to navigate on the client. */
  linkAs?: NavigationMenuLinkComponent;
  className?: string;
}

// Radix (Link asChild) passes its handlers, data attributes and ref through: the link must spread them.
function Anchor(props: ComponentPropsWithRef<'a'> & { href: string }) {
  return <a {...props} />;
}

/**
 * NavigationMenu — Figma [RDS] Navigation/NavigationMenu. The site's top links that open a panel of sub-links, on
 * desktop (Radix NavigationMenu). Click, Enter, Space and hover open a panel; Esc closes it and gives the focus back
 * to its trigger; the arrows move between the items. Inside the signed-in product, the navigation is the Sidebar.
 * Styles: navigation-menu.css.
 */
export function NavigationMenu({ items, linkAs: Link = Anchor, className, ...rest }: NavigationMenuProps) {
  return (
    <Nav.Root {...rest} className={['rds-navmenu', className].filter(Boolean).join(' ')}>
      <Nav.List className="rds-navmenu__items">
        {items.map((item) =>
          'links' in item ? (
            <Nav.Item key={item.label} className="rds-navmenu__item">
              <Nav.Trigger className="rds-navmenu__trigger">
                {item.label}
                <span className="rds-navmenu__chevron" aria-hidden="true">
                  <ChevronDownIcon />
                </span>
              </Nav.Trigger>
              <Nav.Content className="rds-navmenu__panel">
                <ul className="rds-navmenu__links">
                  {item.links.map((link) => (
                    <li key={link.href}>
                      <Nav.Link asChild>
                        <Link href={link.href} className="rds-navmenu__link">
                          <span className="rds-navmenu__link-title">{link.title}</span>
                          {link.description && <span className="rds-navmenu__link-description">{link.description}</span>}
                        </Link>
                      </Nav.Link>
                    </li>
                  ))}
                </ul>
              </Nav.Content>
            </Nav.Item>
          ) : (
            <Nav.Item key={item.label} className="rds-navmenu__item">
              <Nav.Link asChild>
                <Link href={item.href} className="rds-navmenu__trigger">
                  {item.label}
                </Link>
              </Nav.Link>
            </Nav.Item>
          ),
        )}
      </Nav.List>
    </Nav.Root>
  );
}
