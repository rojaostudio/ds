import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { Tile } from './tile';

type Heading = 'h2' | 'h3' | 'h4';

export interface EmptyProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** What is missing (Figma: `title`): "Nenhum pedido por aqui". No "Ops!", and no blaming the person. */
  title: ReactNode;
  /** The heading level that fits the page's heading order. */
  titleAs?: Heading;
  /** How to change that (Figma: `showDescription` + `description`). */
  description?: ReactNode;
  /** The screen's subject (Figma: `showIcon`), an inline SVG shown in a soft lg Tile. */
  icon?: ReactNode;
  /**
   * The Tile's tone. neutral (the Figma), or danger when the content failed to load (the Table's error state).
   */
  tone?: 'neutral' | 'danger';
  /** The way out (Figma: `showAction`): a fill Button. */
  action?: ReactNode;
  /** A second way (Figma: `showSecondaryAction`): an outline Button. */
  secondaryAction?: ReactNode;
  /**
   * A required list left empty, after trying to send (Figma: `error`, ds#146): "Adicione pelo menos um item". Shown
   * under the text in the error colour; the Empty becomes focusable (tabindex -1) with aria-invalid, so the form's
   * focusFirstInvalid lands on it. The Tile turns danger.
   */
  errorMessage?: ReactNode;
}

/**
 * Empty — Figma [RDS] Content/Empty. The empty state: what is missing, why, and what to do. A system error is an
 * Alert, not an Empty. Styles: empty.css.
 */
export function Empty({
  title,
  titleAs: Title = 'h3',
  description,
  icon,
  tone = 'neutral',
  action,
  secondaryAction,
  errorMessage,
  className,
  ...rest
}: EmptyProps) {
  const errorId = useId();
  const invalid = Boolean(errorMessage);
  return (
    <div
      {...(invalid && { tabIndex: -1, 'aria-invalid': true, 'aria-describedby': errorId })}
      {...rest}
      className={['rds-empty', invalid && 'rds-empty--error', className].filter(Boolean).join(' ')}
    >
      {icon && <Tile icon={icon} tone={invalid ? 'danger' : tone} variant="soft" size="lg" />}
      <div className="rds-empty__text">
        <Title className="rds-empty__title">{title}</Title>
        {description && <p className="rds-empty__description">{description}</p>}
        {invalid && (
          <p id={errorId} className="rds-empty__error-message">
            {errorMessage}
          </p>
        )}
      </div>
      {(action || secondaryAction) && (
        <div className="rds-empty__actions">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
