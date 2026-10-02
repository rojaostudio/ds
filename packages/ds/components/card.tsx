'use client';

import { createContext, useContext, useId, type HTMLAttributes, type ReactNode } from 'react';

export type CardSurface = 'default' | 'tint';
export type CardSize = 'default' | 'sm';
type Heading = 'h2' | 'h3' | 'h4';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** tint is the brand's light background, with no border, for a card that stands out. */
  surface?: CardSurface;
  /** sm aligns everything on 12 and makes the header text smaller, for dense lists and indicators. */
  size?: CardSize;
  /** article (default) for a topic that reads on its own; section or div when it is part of something larger. */
  as?: 'article' | 'section' | 'div';
  /**
   * CardHeader, CardContent and CardFooter, in this order (Figma: `showHeader`, the `cardContent` slot,
   * `showFooter`). Header and footer are optional.
   */
  children: ReactNode;
}

const TitleId = createContext<string | undefined>(undefined);

/**
 * Card — Figma [RDS] Content/Card. A topic that reads on its own: a plan, a summary with an action. Never a card
 * inside a card. When it has a CardHeader, the title names the card. Styles: card.css.
 */
export function Card({ surface = 'default', size = 'default', as: Root = 'article', className, children, ...rest }: CardProps) {
  const titleId = useId();
  const labelled = Root !== 'div' && !rest['aria-label'] && !rest['aria-labelledby'];
  return (
    <TitleId.Provider value={labelled ? titleId : undefined}>
      <Root
        aria-labelledby={labelled ? titleId : undefined}
        {...rest}
        className={['rds-card', `rds-card--${surface}`, size === 'sm' && 'rds-card--sm', className].filter(Boolean).join(' ')}
      >
        {children}
      </Root>
    </TitleId.Provider>
  );
}

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** What the card is about (Figma: `title`). It names the card for screen readers. */
  title: ReactNode;
  /** The heading level that fits the page's heading order. */
  titleAs?: Heading;
  /** One supporting line (Figma: `showDescription` + `description`). */
  description?: ReactNode;
  /** A Tile before the text (Figma: `showIcon`): variant soft, size default (sm on a small card). */
  icon?: ReactNode;
  /** One action on the right (Figma: `showAction` + `action`): a ghost Button or an IconButton. */
  action?: ReactNode;
  /** start: side by side; center: stacked and centred. */
  align?: 'start' | 'center';
}

/** The card's header (Figma: .card/header). */
export function CardHeader({ title, titleAs: Title = 'h3', description, icon, action, align = 'start', className, ...rest }: CardHeaderProps) {
  const titleId = useContext(TitleId);
  return (
    <header {...rest} className={['rds-card__header', `rds-card__header--${align}`, className].filter(Boolean).join(' ')}>
      {icon}
      <div className="rds-card__heading">
        <Title id={titleId} className="rds-card__title">
          {title}
        </Title>
        {description && <p className="rds-card__description">{description}</p>}
      </div>
      {action && <div className="rds-card__action">{action}</div>}
    </header>
  );
}

export type CardContentProps = HTMLAttributes<HTMLDivElement>;

/** The card's content (Figma: the `cardContent` slot). */
export function CardContent({ className, ...rest }: CardContentProps) {
  return <div {...rest} className={['rds-card__content', className].filter(Boolean).join(' ')} />;
}

export interface CardFooterProps extends HTMLAttributes<HTMLElement> {
  /** One or two Buttons (Figma: `actions` one · two). A third action goes into the content, as a link. */
  children: ReactNode;
  /** start, end, or full (buttons stacked across the whole width). */
  align?: 'start' | 'end' | 'full';
  /** A line under the buttons (Figma: `showTertiaryContent` + `tertiaryContent`), such as a sign-up link. */
  note?: ReactNode;
}

/** The card's footer, with its actions (Figma: .card/footer). */
export function CardFooter({ align = 'end', note, className, children, ...rest }: CardFooterProps) {
  return (
    <footer {...rest} className={['rds-card__footer', `rds-card__footer--${align}`, className].filter(Boolean).join(' ')}>
      <div className="rds-card__actions">{children}</div>
      {note && <p className="rds-card__note">{note}</p>}
    </footer>
  );
}
