import type { HTMLAttributes, ReactNode } from 'react';
import { SparklesIcon } from './internal/icons';
import { Spinner } from './spinner';

/** The marker's shape (Figma: `kind`): it is the form, not the emphasis, so it is not a `variant`. */
export type MarkerKind = 'inline' | 'border' | 'separator';

export interface MarkerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * inline (default): icon and text; border: with a line under it, to split rows; separator: the text between two
   * lines (Figma: `kind`).
   */
  kind?: MarkerKind;
  /** The assistant's status, a system note or a date (Figma: `text`). */
  children: ReactNode;
  /**
   * The icon before the text (Figma: `showIcon` + `icon`), decorative. By default the assistant's sparkles; `null`
   * hides it. Not shown in `separator`.
   */
  icon?: ReactNode;
  /** The status is in progress: a Spinner in place of the icon, and the text is announced (role="status"). */
  loading?: boolean;
}

/**
 * Marker — Figma [RDS] Chat/Marker. A line inside the conversation that is not a message: the assistant's status
 * ("Buscando…"), a system note or a date between two lines. Styles: marker.css.
 */
export function Marker({ kind = 'inline', children, icon = <SparklesIcon />, loading, className, ...rest }: MarkerProps) {
  const classes = ['rds-marker', `rds-marker--${kind}`, className].filter(Boolean).join(' ');
  const role = loading ? 'status' : undefined;
  if (kind === 'separator') {
    return (
      <div role={role} {...rest} className={classes}>
        <span className="rds-marker__line" aria-hidden="true" />
        <span className="rds-marker__text">{children}</span>
        <span className="rds-marker__line" aria-hidden="true" />
      </div>
    );
  }
  const shown = loading ? <Spinner size="sm" /> : icon;
  return (
    <div role={role} {...rest} className={classes}>
      {shown && (
        <span className="rds-marker__icon" aria-hidden="true">
          {shown}
        </span>
      )}
      <span className="rds-marker__text">{children}</span>
    </div>
  );
}
