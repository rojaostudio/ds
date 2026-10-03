import type { HTMLAttributes, ReactNode } from 'react';

/** The [RDS] type scale for titles: band 36/48, heading 24/30, value 20/30. */
export type HeadingLevel = 'band' | 'heading' | 'value';
/** default: text/heading (navy on light in Rojão, white on dark and on the brand plate). accent: the logo orange. */
export type HeadingTone = 'default' | 'accent';
/** The element in the page outline. The visual level never decides it: the order of the page does. */
export type HeadingElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** The size, from the type scale (Figma `level`). */
  level?: HeadingLevel;
  /** The colour of the brand pair (Figma `tone`). The Mark takes the other one. */
  tone?: HeadingTone;
  /** The heading element. Default h2. */
  as?: HeadingElement;
  /** The text (Figma `text`), with an optional <Heading.Mark> stretch (Figma `showMark` + `mark`). */
  children: ReactNode;
}

export interface HeadingMarkProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

/**
 * Heading.Mark — Figma [RDS] .heading/mark. A stretch of the title in the other colour of the pair: accent inside a
 * default Heading, default inside an accent one. A plain span: screen readers read the whole title, unannounced.
 */
export function HeadingMark({ className, children, ...rest }: HeadingMarkProps) {
  return (
    <span {...rest} className={['rds-heading__mark', className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}

/**
 * Heading — Figma [RDS] Content/Heading. A title in the brand pair: one colour, or both in the same title with a
 * Heading.Mark. The colour is chosen per screen; tone=default is the rule. Orange on white fails contrast even for
 * a large title (2.9:1 in Rojão): tone=accent belongs on dark or on the brand plate. Styles: heading.css.
 */
function HeadingRoot({ level = 'heading', tone = 'default', as: Tag = 'h2', className, children, ...rest }: HeadingProps) {
  return (
    <Tag
      {...rest}
      className={['rds-heading', `rds-heading--${level}`, tone === 'accent' && 'rds-heading--accent', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  );
}

/** `<Heading>` with `<Heading.Mark>` for the stretch in the other colour. */
export const Heading = Object.assign(HeadingRoot, { Mark: HeadingMark });
