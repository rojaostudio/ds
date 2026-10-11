import type { HTMLAttributes, ReactNode } from 'react';

/** The [RDS] type scale for titles: band 36/48, heading 24/30, value 20/30. */
export type HeadingLevel = 'band' | 'heading' | 'value';
/**
 * neutral: text/heading (navy on light in Rojão, white on dark and on the brand plate). accent: text/accent, the accent
 * as text (in Rojão a darker orange on light, the logo orange on dark), 3:1 on page and card.
 */
export type HeadingTone = 'neutral' | 'accent';
/** The element in the page outline. The visual level never decides it: the order of the page does. */
export type HeadingElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
/** start (default) or center: the centred header of an access card or dialog. */
export type HeadingAlign = 'start' | 'center';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** The size, from the type scale (Figma `level`). */
  level?: HeadingLevel;
  /**
   * The colour of the brand pair (Figma `tone`): neutral (default) or accent. The Mark takes the other one.
   */
  tone?: HeadingTone;
  /** The alignment (Figma `align`): start (default) or center; a long title wraps centred. */
  align?: HeadingAlign;
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
 * neutral Heading, neutral inside an accent one. A plain span: screen readers read the whole title, unannounced.
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
 * Heading.Mark. The colour is chosen per screen; tone=neutral is the rule.
 *
 * The accent (tone=accent, or the Mark of a neutral Heading) is text/accent, which only clears 3:1, the contrast of
 * large text: use it only in a large title, 24px and up, or 18.66px and up in bold (every level of the Heading is
 * bold and 20px or more). Never in a label or in running text. Styles: heading.css.
 */
function HeadingRoot({ level = 'heading', tone = 'neutral', align = 'start', as: Tag = 'h2', className, children, ...rest }: HeadingProps) {
  return (
    <Tag
      {...rest}
      className={['rds-heading', `rds-heading--${level}`, tone === 'accent' && 'rds-heading--accent', align === 'center' && 'rds-heading--center', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  );
}

/** `<Heading>` with `<Heading.Mark>` for the stretch in the other colour. */
export const Heading = Object.assign(HeadingRoot, { Mark: HeadingMark });
