'use client';

import { useId, useState, type FormEvent, type HTMLAttributes, type ReactNode } from 'react';
import { Button } from './button';
import { Input } from './input';
import { BlockHeading } from './internal/block';

export interface NewsletterProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'onSubmit'> {
  /** The block's title, an h2 that names the section and the form (Figma: `title`). */
  title: ReactNode;
  description?: ReactNode;
  /** A line under the form: what the person gets, how to cancel (Figma: `note`). */
  note?: ReactNode;
  /** The field's name, off screen but read (the Figma shows only the placeholder). */
  inputLabel?: string;
  placeholder?: string;
  /** The button's verb. */
  submitLabel?: string;
  /** The message when the e-mail does not look valid. */
  invalidMessage?: string;
  /** Runs with the e-mail when it looks valid; otherwise the field shows `invalidMessage`. */
  onSubscribe: (email: string, event: FormEvent<HTMLFormElement>) => void;
}

const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter — Figma [RDS] Blocks/Newsletter. A call to subscribe by e-mail, centred on the page: title, sentence,
 * the field with the button and a note. Below 640 of container width the field and the button stack (Figma:
 * `screen`). Styles: newsletter.css.
 */
export function Newsletter({
  title,
  description,
  note,
  inputLabel = 'E-mail',
  placeholder = 'nome@empresa.com.br',
  submitLabel = 'Assinar',
  invalidMessage = 'Falta o @ ou o domínio. Exemplo: nome@empresa.com.br',
  onSubscribe,
  className,
  ...rest
}: NewsletterProps) {
  const titleId = useId();
  const [error, setError] = useState(false);
  return (
    <section aria-labelledby={titleId} {...rest} className={['rds-block', 'rds-newsletter', className].filter(Boolean).join(' ')}>
      <div className="rds-block__inner">
        <BlockHeading title={title} description={description} titleId={titleId} />
        <form
          className="rds-newsletter__form"
          aria-labelledby={titleId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const email = String(new FormData(event.currentTarget).get('email') ?? '').trim();
            const valid = LOOKS_LIKE_EMAIL.test(email);
            setError(!valid);
            if (valid) onSubscribe(email, event);
          }}
        >
          <div className="rds-newsletter__field">
            <Input
              name="email"
              type="email"
              autoComplete="email"
              aria-label={inputLabel}
              placeholder={placeholder}
              errorMessage={error ? invalidMessage : undefined}
              onChange={() => error && setError(false)}
            />
          </div>
          <Button type="submit">{submitLabel}</Button>
        </form>
        {note && <p className="rds-newsletter__note">{note}</p>}
      </div>
    </section>
  );
}
