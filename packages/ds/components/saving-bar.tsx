'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { Button } from './button';
import { BottomBar, type BottomBarPlacement } from './internal/bottom-bar';
import { AlertIcon } from './internal/icons';

export type SavingBarStatus = 'unsaved' | 'saving' | 'error';

export type SavingBarPlacement = BottomBarPlacement;

export interface SavingBarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * unsaved: the message and the actions; saving: `savingMessage`, Salvar in loading (`savingLabel`, the only
   * indicator, no loader in the message) and Descartar disabled; error: an alert, `errorMessage`, and Salvar
   * becomes `retryLabel` (Figma: `status`).
   */
  status?: SavingBarStatus;
  /** The unsaved text, at most 2 lines with an ellipsis (Figma: `message`). */
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
   * arrangement (the phone) the bar has only the main button, and Descartar belongs to the way out, in the
   * confirmation when leaving with changes (AlertDialog).
   */
  onDiscard?: () => void;
  saveLabel?: string;
  retryLabel?: string;
  discardLabel?: string;
  /**
   * docked (default: the container's width, against the foot) or floating (from 1024 up: off the foot, rounded, the
   * overlay shadow, 24 of margin, at most 768, centred). Below 1024 floating is docked (Figma: `placement`).
   */
  placement?: SavingBarPlacement;
  /**
   * One ~44 control on the left of the message, never running text (Figma: slot `leading`, `showLeading`). Present,
   * even `null` while its control is hidden, it reserves 44 so the message and the buttons do not jump. Whoever fills
   * it says its own changes (its own aria-live); the bar does not repeat them.
   */
  leading?: ReactNode;
}

/**
 * SavingBar — Figma [RDS] Actions/SavingBar. Shows at the foot of the screen while a change is not saved, and leaves
 * once saved (a Toast confirms). Built on the private BottomBar (.rds-bottom-bar), the FormActions' shell: the brand's
 * primary colour (bottom-bar/background) in light, dark and every brand, 64 plus the safe area compact, 68 expanded,
 * 24 at the sides, sticky at the bottom of the scrolling container. Its Buttons are Salvar in tone action fill and
 * Descartar in tone neutral ghost, with the bar's colours (bottom-bar/button/*). Below 1024 (compact, the phone) it is
 * one row: the message on the left and only Salvar on the right; Descartar is in the confirmation when leaving. While
 * saving, the indicator is Salvar in loading, alone (with the LoadingOverlay too). On the phone it leaves while the
 * on-screen keyboard is open and comes back on blur, never taking the focus. The content needs room below as tall as
 * the bar (`scroll-padding-bottom`, plus `env(safe-area-inset-bottom)`). Styles: saving-bar.css,
 * internal/bottom-bar.css.
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
  placement = 'docked',
  leading,
  className,
  ...rest
}: SavingBarProps) {
  const saving = status === 'saving';
  const error = status === 'error';
  const text = saving ? savingMessage : error ? errorMessage : message;
  return (
    <BottomBar
      role="region"
      aria-label="Salvar alterações"
      {...rest}
      placement={placement}
      leading={leading}
      className={['rds-savingbar', className].filter(Boolean).join(' ')}
    >
      {/* A live region: the change of status is said without moving focus. */}
      <p className="rds-savingbar__message" role="status">
        {/* The text beside it already says it; the alert is only the picture. No loader here while saving: the
            indicator is Salvar in loading, so there are never two. */}
        {error && (
          <span className="rds-savingbar__icon" aria-hidden="true">
            <AlertIcon />
          </span>
        )}
        <span className="rds-savingbar__text">{text}</span>
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
    </BottomBar>
  );
}
