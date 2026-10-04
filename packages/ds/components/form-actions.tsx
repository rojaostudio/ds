'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { BottomBar, type BottomBarPlacement } from './internal/bottom-bar';

export type FormActionsPlacement = BottomBarPlacement;

export interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The actions (Figma: the exposed `cancel` and `primary` Buttons), in reading order: Cancelar (tone neutral, ghost)
   * first, the primary (tone action, fill) last. Expanded (from 1024) they all show, on the right; compact (below
   * 1024) only the last one, the primary: the others are `display: none`, and the way out is the topbar's X.
   */
  children: ReactNode;
  /**
   * docked (default: the container's width, against the foot) or floating (from 1024 up: off the foot, rounded, the
   * overlay shadow, 24 of margin, at most 768, centred). Below 1024 floating is docked (Figma: `placement`).
   */
  placement?: FormActionsPlacement;
  /**
   * One ~44 control on the left, never running text (Figma: slot `leading`, `showLeading`). Present, even `null`
   * while its control is hidden, it reserves 44 so the actions do not jump. Whoever fills it says its own changes
   * (its own aria-live); the bar says nothing.
   */
  leading?: ReactNode;
}

/**
 * FormActions — Figma [RDS] Actions/FormActions. The actions at the end of a create form or of a long task (Cancelar
 * and the primary), at the foot of the screen from the first second. Only actions: what is missing is the project's
 * (if it needs a control, it goes in `leading`). Built on the private BottomBar (.rds-bottom-bar), the SavingBar's
 * shell: a band in the brand's primary colour (bottom-bar/background), 64 plus the safe area compact, 68 expanded,
 * 24 at the sides, sticky at the bottom of the scrolling container. Styles: form-actions.css, internal/bottom-bar.css.
 *
 * `<FormActions placement="docked" leading={…}><Button tone="neutral" variant="ghost">Cancelar</Button><Button
 * tone="action">Criar produto</Button></FormActions>`: the last child is the primary; compact, the others leave.
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
 * - Compact has no Cancelar: the way out is the X in the topbar, with an AlertDialog "Sair sem criar?" ([Continuar
 *   editando] [Sair sem criar]) when something was typed.
 * - Buttons at the end of a card or a dialog are loose Buttons or a ButtonGroup, not this.
 */
export function FormActions({ children, placement = 'docked', leading, className, ...rest }: FormActionsProps) {
  return (
    <BottomBar {...rest} placement={placement} leading={leading} className={['rds-form-actions', className].filter(Boolean).join(' ')}>
      <div className="rds-form-actions__actions">{children}</div>
    </BottomBar>
  );
}
