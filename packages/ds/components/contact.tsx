'use client';

import { useId, type FormEvent, type HTMLAttributes, type ReactNode } from 'react';
import { BlockHeading } from './internal/block';

export interface ContactProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'onSubmit'> {
  eyebrow?: ReactNode;
  /** The block's title, an h2 that names the section and the form. */
  title: ReactNode;
  description?: ReactNode;
  /**
   * The fields and the button (the Figma exposes them): Input name and e-mail, Textarea, the consent Checkbox and a
   * submit Button, which takes the full width.
   */
  children: ReactNode;
  /** Runs on send, with the form's data. The browser's own validation is off: show the fields' errors. */
  onSubmit: (data: FormData, event: FormEvent<HTMLFormElement>) => void;
}

/**
 * Contact — Figma [RDS] Blocks/Contact. The contact form of a public page. Adapts to the width of its container
 * (Figma: `screen`). Styles: contact.css.
 */
export function Contact({ eyebrow, title, description, children, onSubmit, className, ...rest }: ContactProps) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} {...rest} className={['rds-block', 'rds-contact', className].filter(Boolean).join(' ')}>
      <div className="rds-block__inner">
        <BlockHeading eyebrow={eyebrow} title={title} description={description} titleId={titleId} />
        <form
          className="rds-contact__form"
          aria-labelledby={titleId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(new FormData(event.currentTarget), event);
          }}
        >
          {children}
        </form>
      </div>
    </section>
  );
}
