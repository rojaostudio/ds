import type { HTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { IconButton } from './icon-button';
import { ArrowLeftIcon, HelpCircleIcon } from './internal/icons';
import { Tooltip } from './tooltip';

export type PageHeaderHeading = 'h1' | 'h2' | 'h3';

/** The way back to the parent page (Figma: `showBack`). */
export interface PageHeaderBack {
  /** The parent page: a link, never history.back. */
  href: string;
  /** The parent page's name: the Tooltip, and "Voltar para {label}" as the accessible name. */
  label: string;
}

/** The screen's help (Figma: `showHelp`): it opens the help of the screen (a Sheet) or leads to it. */
export interface PageHeaderHelp {
  /** The Tooltip ("Como funciona"); the accessible name is "{label}: {title}". */
  label: string;
  /** Opens the help (a button). */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Leads to the help (a link). */
  href?: string;
}

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
  /**
   * Back to the parent page (Figma: `showBack`): a link with an IconButton neutral ghost arrow-left and a Tooltip with
   * the parent's name, 8 before the title, centred on the title's line even with a description. For second-level
   * screens and below, never the first. Independent of the Breadcrumb.
   */
  back?: PageHeaderBack;
  /**
   * The screen's help (Figma: `showHelp`): an IconButton neutral ghost circle-question-mark with its Tooltip, beside
   * the title, centred on the title's line.
   */
  help?: PageHeaderHelp;
}

/** The title as plain text, for the help's accessible name. */
const textOf = (node: ReactNode): string =>
  typeof node === 'string' || typeof node === 'number'
    ? String(node)
    : Array.isArray(node)
      ? node.map(textOf).join('')
      : '';

/**
 * PageHeader — Figma [RDS] Navigation/PageHeader. The top of a screen: path, the way back, title (with its help),
 * what it does, the main actions and, when the screen splits, the tabs. On a phone the actions go under the title;
 * the way back stays where it is. Styles: page-header.css.
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  tabs,
  titleAs = 'h1',
  back,
  help,
  className,
  ...rest
}: PageHeaderProps) {
  const Root = titleAs === 'h1' ? 'header' : 'div';
  const Title = titleAs;
  const titleText = textOf(title);
  const helpName = titleText ? `${help?.label}: ${titleText}` : help?.label;
  return (
    <Root {...rest} className={['rds-page-header', className].filter(Boolean).join(' ')}>
      {breadcrumb}
      <div className="rds-page-header__row">
        <div className="rds-page-header__heading">
          {back && (
            <div className="rds-page-header__back">
              <Tooltip text={back.label}>
                <IconButton asChild icon={<ArrowLeftIcon />} label={`Voltar para ${back.label}`} tone="neutral" variant="ghost">
                  <a href={back.href} />
                </IconButton>
              </Tooltip>
            </div>
          )}
          <div className="rds-page-header__text">
            <div className="rds-page-header__title-row">
              <Title className="rds-page-header__title">{title}</Title>
              {help && (
                <div className="rds-page-header__help">
                  <Tooltip text={help.label}>
                    {help.href ? (
                      <IconButton asChild icon={<HelpCircleIcon />} label={helpName!} tone="neutral" variant="ghost" onClick={help.onClick}>
                        <a href={help.href} />
                      </IconButton>
                    ) : (
                      <IconButton icon={<HelpCircleIcon />} label={helpName!} tone="neutral" variant="ghost" onClick={help.onClick} />
                    )}
                  </Tooltip>
                </div>
              )}
            </div>
            {description && <p className="rds-page-header__description">{description}</p>}
          </div>
        </div>
        {actions && <div className="rds-page-header__actions">{actions}</div>}
      </div>
      {tabs}
    </Root>
  );
}
