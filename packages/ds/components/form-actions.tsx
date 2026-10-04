'use client';

import { Children, isValidElement, type HTMLAttributes, type MouseEventHandler, type ReactNode } from 'react';
import { IconButton } from './icon-button';
import { BottomBar, type BottomBarPlacement } from './internal/bottom-bar';
import { CloseIcon } from './internal/icons';
import { Tooltip } from './tooltip';

export type FormActionsPlacement = BottomBarPlacement;

export interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The actions (Figma: the exposed `cancel` and `primary` Buttons), in reading order: Cancelar (tone neutral, ghost)
   * first, the primary (tone action, fill) last. Expanded (from 1024) they all show, on the right, 8 apart. Compact
   * (below 1024) the first one, Cancelar, becomes an IconButton with the X (tone neutral, ghost, md), named by its
   * label and with its Tooltip, beside the primary: leading, X, primary. Any action between the two is `display: none` in compact.
   */
  children: ReactNode;
  /**
   * docked (default: the container's width, against the foot) or floating (from 1024 up: in the bottom right corner,
   * 24 off the foot and the right, hugging its content, rounded, the overlay shadow). Below 1024 floating is docked
   * (Figma: `placement`).
   */
  placement?: FormActionsPlacement;
  /**
   * One ~44 control on the left, never running text (Figma: slot `leading`, `showLeading`). Left out, no slot. Present,
   * even `null` while its control is hidden, it reserves 44 so the actions do not jump. Whoever fills it says its own
   * changes (its own aria-live); the bar says nothing.
   */
  leading?: ReactNode;
}

interface CancelProps {
  children?: ReactNode;
  'aria-label'?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

/** The plain text of a label (strings and numbers, down through elements): the X's accessible name. */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

/**
 * FormActions — Figma [RDS] Actions/FormActions. The actions at the end of a create form or of a long task (Cancelar
 * and the primary), at the foot of the screen from the first second. Only actions: what is missing is the project's
 * (if it needs a control, it goes in `leading`). Built on the private BottomBar (.rds-bottom-bar), the SavingBar's
 * shell: a band in the brand's primary colour (bottom-bar/background), 64 plus the safe area compact, 68 expanded,
 * 24 at the sides, sticky at the bottom of the scrolling container. Styles: form-actions.css, internal/bottom-bar.css.
 *
 * `<FormActions placement="docked" leading={…}><Button tone="neutral" variant="ghost" onClick={cancel}>Cancelar
 * </Button><Button tone="action">Criar produto</Button></FormActions>`: the last child is the primary, the first
 * (when there are two or more) is Cancelar.
 *
 * Compact, Cancelar is drawn as the X: an IconButton built from the first child's props, so give that child its
 * label as text (or `aria-label`), its `onClick` and, if it has one, `disabled`. The X's `aria-label` is that label.
 * With more than two children, the ones between Cancelar and the primary are not shown in compact (`display: none`):
 * put them somewhere else on the phone, or keep two.
 *
 * The app's rules around it:
 * - The primary is never disabled: validate on click, show the error on the field and move the focus to the first
 *   pending one.
 * - The scrolling container takes `scroll-padding-bottom` (and the content `padding-bottom`) equal to the bar's height
 *   (plus the margin when floating) plus `env(safe-area-inset-bottom)`, so a focused field is never hidden behind it
 *   (WCAG 2.4.11).
 * - On the phone (below 1024) the bar leaves while the on-screen keyboard is open (a field is focused and the visible
 *   area shrinks): it slides down (no motion with prefers-reduced-motion) and comes back on blur; it never takes the
 *   focus.
 * - Leaving with something typed (Cancelar or the X) asks first, with an AlertDialog "Sair sem criar?" ([Continuar
 *   editando] [Sair sem criar]).
 * - Buttons at the end of a card or a dialog are loose Buttons or a ButtonGroup, not this.
 */
export function FormActions({ children, placement = 'docked', leading, className, ...rest }: FormActionsProps) {
  const actions = Children.toArray(children);
  const cancel = actions.length > 1 && isValidElement<CancelProps>(actions[0]) ? actions[0].props : null;
  const cancelLabel = cancel ? cancel['aria-label'] || textOf(cancel.children) : '';
  const primary = actions[actions.length - 1];
  return (
    <BottomBar {...rest} placement={placement} leading={leading} className={['rds-form-actions', className].filter(Boolean).join(' ')}>
      <div className="rds-form-actions__actions">
        {actions.slice(0, -1)}
        {cancel && (
          <Tooltip text={cancelLabel}>
            <IconButton
              className="rds-form-actions__cancel-icon"
              icon={<CloseIcon />}
              label={cancelLabel}
              tone="neutral"
              variant="ghost"
              size="md"
              disabled={cancel.disabled}
              onClick={cancel.onClick}
            />
          </Tooltip>
        )}
        {primary}
      </div>
    </BottomBar>
  );
}
