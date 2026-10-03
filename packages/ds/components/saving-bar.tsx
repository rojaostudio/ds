'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { Button } from './button';
import { Loader } from './internal/button';
import { AlertIcon } from './internal/icons';

export type SavingBarStatus = 'unsaved' | 'saving' | 'error';

export interface SavingBarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * unsaved: the message and the actions; saving: a turning loader and `savingMessage`, buttons off;
   * error: an alert, `errorMessage`, and Salvar becomes `retryLabel` (Figma: `status`).
   */
  status?: SavingBarStatus;
  /** The unsaved text (Figma: `message`). */
  message?: ReactNode;
  /** The text while saving. */
  savingMessage?: ReactNode;
  /** The error text. */
  errorMessage?: ReactNode;
  /** Called by Salvar (and by Tentar de novo, on error). */
  onSave: () => void;
  /** Shows Descartar and is called when it is pressed (Figma: `showDiscard`). */
  onDiscard?: () => void;
  saveLabel?: string;
  retryLabel?: string;
  discardLabel?: string;
}

/**
 * SavingBar — Figma [RDS] Actions/SavingBar. Shows at the foot of the screen while a change is not
 * saved, and leaves once saved. Painted with colors/primary on purpose: a state that waits for a
 * decision, not a notice. It does not place itself: put it sticky or fixed at the bottom.
 * Its Buttons use the inverse tone, drawn for the colors/primary band in both modes. Styles: saving-bar.css.
 */
export function SavingBar({
  status = 'unsaved',
  message = 'Alterações não salvas',
  savingMessage = 'Salvando…',
  errorMessage = 'Não salvou. Tente de novo.',
  onSave,
  onDiscard,
  saveLabel = 'Salvar',
  retryLabel = 'Tentar de novo',
  discardLabel = 'Descartar',
  className,
  ...rest
}: SavingBarProps) {
  const saving = status === 'saving';
  const error = status === 'error';
  return (
    <div
      role="region"
      aria-label="Salvar alterações"
      {...rest}
      className={['rds-savingbar', className].filter(Boolean).join(' ')}
    >
      {/* The bar is the size container; this row is what changes arrangement (expanded or compact). */}
      <div className="rds-savingbar__row">
        {/* A live region: the change of status is said without moving focus. */}
        <p className="rds-savingbar__message" role="status">
          {/* The text beside them already says it; the loader and the alert are only the picture. */}
          {saving && (
            <span className="rds-savingbar__icon rds-savingbar__loader" aria-hidden="true">
              <Loader />
            </span>
          )}
          {error && (
            <span className="rds-savingbar__icon" aria-hidden="true">
              <AlertIcon />
            </span>
          )}
          <span className="rds-savingbar__text">{saving ? savingMessage : error ? errorMessage : message}</span>
        </p>
        <div className="rds-savingbar__actions">
          {onDiscard && (
            <Button tone="inverse" variant="ghost" disabled={saving} onClick={onDiscard}>
              {discardLabel}
            </Button>
          )}
          <Button tone="inverse" variant="fill" disabled={saving} onClick={onSave}>
            {error ? retryLabel : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
