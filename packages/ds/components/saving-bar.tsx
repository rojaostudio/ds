'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { Button } from './button';
import { AlertIcon, ChevronUpIcon } from './internal/icons';
import { useOnScreenKeyboard } from './internal/use-on-screen-keyboard';

export type SavingBarStatus = 'unsaved' | 'saving' | 'error';

export interface SavingBarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * unsaved: the message and the actions; saving: `savingMessage`, Salvar in loading (`savingLabel`, the only
   * indicator, no loader in the message) and Descartar disabled; error: an alert, `errorMessage`, and Salvar
   * becomes `retryLabel` (Figma: `status`).
   */
  status?: SavingBarStatus;
  /** The unsaved text (Figma: `message`). */
  message?: ReactNode;
  /** The text while saving. */
  savingMessage?: ReactNode;
  /** Salvar's label while saving, in loading (`<Button loading>`), also announced. */
  savingLabel?: string;
  /** The error text. */
  errorMessage?: ReactNode;
  /** Called by Salvar (and by Tentar de novo, on error). */
  onSave: () => void;
  /**
   * Shows Descartar and is called when it is pressed (Figma: `showDiscard`). Expanded only: in the compact
   * arrangement (the phone) the bar has only the main button, and Descartar belongs to the app, in the footer of
   * the details Drawer or in the confirmation when leaving with changes (AlertDialog).
   */
  onDiscard?: () => void;
  saveLabel?: string;
  retryLabel?: string;
  discardLabel?: string;
  /**
   * Turns the unsaved message into a button that opens what is missing (a Drawer with the checklist), in the
   * compact arrangement only; expanded, the message stays text (Figma: `showDetails`).
   */
  onDetails?: () => void;
  /** Said after the message in the details button's accessible name, hidden on screen. */
  detailsLabel?: string;
  /** Whether the panel the details button opens is open (aria-expanded). */
  detailsExpanded?: boolean;
  /** The id of that panel (aria-controls). */
  detailsControls?: string;
}

/**
 * SavingBar — Figma [RDS] Actions/SavingBar. Shows at the foot of the screen while a change is not
 * saved, and leaves once saved. It is the brand's primary colour (savingbar/background, colors/primary/default),
 * in light and dark and in every brand: a state that waits for a decision, not a notice. It does not place itself:
 * put it sticky or fixed at the bottom. Its Buttons are Salvar in tone action and Descartar in tone neutral ghost,
 * with the bar's colours (savingbar/button/*). Below 1024 (compact, the phone) it is one row, 64 tall plus the
 * safe area: the message (or the details button) on the left and only Salvar on the right; Descartar is the app's
 * there, in the footer of the details Drawer or in the confirmation when leaving. While saving, the indicator is
 * Salvar in loading, alone (with the LoadingOverlay too). On the phone it leaves while the on-screen keyboard is open (a
 * field is focused and the visible area shrinks), so it does not cover the field being typed in: it slides down (no
 * motion with prefers-reduced-motion) and comes back when the keyboard closes, never taking the focus. Styles:
 * saving-bar.css.
 */
export function SavingBar({
  status = 'unsaved',
  message = 'Alterações não salvas',
  savingMessage = 'Salvando…',
  savingLabel = 'Salvando…',
  errorMessage = 'Não salvou. Tente de novo.',
  onSave,
  onDiscard,
  saveLabel = 'Salvar',
  retryLabel = 'Tentar de novo',
  discardLabel = 'Descartar',
  onDetails,
  detailsLabel = 'Ver o que falta',
  detailsExpanded,
  detailsControls,
  className,
  ...rest
}: SavingBarProps) {
  const keyboard = useOnScreenKeyboard();
  const saving = status === 'saving';
  const error = status === 'error';
  const text = saving ? savingMessage : error ? errorMessage : message;
  // Details only in unsaved: the button promises the list of what is missing.
  const details = status === 'unsaved' && onDetails !== undefined;
  return (
    <div
      role="region"
      aria-label="Salvar alterações"
      {...rest}
      className={['rds-savingbar', keyboard && 'rds-savingbar--keyboard', className].filter(Boolean).join(' ')}
    >
      {/* This row is what changes arrangement (expanded or compact), by the screen width as the Figma viewport mode. */}
      <div className="rds-savingbar__row">
        {/* A live region: the change of status is said without moving focus. */}
        <p className={['rds-savingbar__message', details && 'rds-savingbar__message--details'].filter(Boolean).join(' ')} role="status">
          {/* The text beside it already says it; the alert is only the picture. No loader here while saving: the
              indicator is Salvar in loading, so there are never two. */}
          {error && (
            <span className="rds-savingbar__icon" aria-hidden="true">
              <AlertIcon />
            </span>
          )}
          {/* With details, two renderings of the message, one shown at a time (display: none takes the other out of
              the accessibility tree too, so the status is said once): text when expanded, a button when compact. */}
          <span className="rds-savingbar__text">{text}</span>
          {details && (
            <button
              type="button"
              className="rds-savingbar__details"
              aria-expanded={detailsExpanded ?? false}
              aria-controls={detailsControls}
              onClick={onDetails}
            >
              <span className="rds-savingbar__text">{text}</span>
              <span className="rds-visually-hidden">, {detailsLabel}</span>
              <span className="rds-savingbar__icon" aria-hidden="true">
                <ChevronUpIcon />
              </span>
            </button>
          )}
        </p>
        <div className="rds-savingbar__actions">
          {onDiscard && (
            <Button className="rds-savingbar__discard" tone="neutral" variant="ghost" disabled={saving} onClick={onDiscard}>
              {discardLabel}
            </Button>
          )}
          <Button tone="action" variant="fill" loading={saving} loadingLabel={savingLabel} onClick={onSave}>
            {saving ? savingLabel : error ? retryLabel : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
