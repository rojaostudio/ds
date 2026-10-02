import type { HTMLAttributes, ReactNode } from 'react';

export type PageHeaderHeading = 'h1' | 'h2' | 'h3';

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The screen's name (Figma: `title`). It does not repeat the path. */
  title: ReactNode;
  /** What the screen does, in one sentence (Figma: `showDescription` + `description`). */
  description?: ReactNode;
  /** Where the person is: a Breadcrumb (Figma: `showBreadcrumb`). */
  breadcrumb?: ReactNode;
  /** Up to two actions on the right, the main one a Button action fill (Figma: the `actions` slot). */
  actions?: ReactNode;
  /**
   * A TabsList, when the screen splits into views (Figma: `showTabs`). The Tabs root wraps the PageHeader and the
   * TabsContent panels under it.
   */
  tabs?: ReactNode;
  /**
   * The title's heading level. h1 (default) for the top of a screen, inside a <header>; h2 or h3 for a section
   * inside the page, following its outline (then a <div>). Not in the Figma: it only changes the semantics.
   */
  titleAs?: PageHeaderHeading;
}

/**
 * PageHeader — Figma [RDS] Navigation/PageHeader. The top of a screen: path, title, what it does, the main actions
 * and, when the screen splits, the tabs. On a phone the actions go under the title. Styles: page-header.css.
 */
export function PageHeader({ title, description, breadcrumb, actions, tabs, titleAs = 'h1', className, ...rest }: PageHeaderProps) {
  const Root = titleAs === 'h1' ? 'header' : 'div';
  const Title = titleAs;
  return (
    <Root {...rest} className={['rds-page-header', className].filter(Boolean).join(' ')}>
      {breadcrumb}
      <div className="rds-page-header__row">
        <div className="rds-page-header__heading">
          <Title className="rds-page-header__title">{title}</Title>
          {description && <p className="rds-page-header__description">{description}</p>}
        </div>
        {actions && <div className="rds-page-header__actions">{actions}</div>}
      </div>
      {tabs}
    </Root>
  );
}
