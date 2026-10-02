// The shared heading of the public-page blocks (Benefits, Contact, FAQ, Newsletter, Testimonial): eyebrow, title
// (h2) and description, centred. Each block paints it with its own tokens. Not exported. Styles: internal/block.css.
import type { ReactNode } from 'react';

export interface BlockHeadingProps {
  /** A short label above the title (Figma: `eyebrow`). */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** The title's id: it names the block's <section>. */
  titleId: string;
}

export function BlockHeading({ eyebrow, title, description, titleId }: BlockHeadingProps) {
  return (
    <div className="rds-block__heading">
      {eyebrow && <p className="rds-block__eyebrow">{eyebrow}</p>}
      <h2 id={titleId} className="rds-block__title">
        {title}
      </h2>
      {description && <p className="rds-block__description">{description}</p>}
    </div>
  );
}

export const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');
