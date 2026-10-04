import { Children, type HTMLAttributes, type ReactNode } from 'react';
import { ChevronUpIcon } from './internal/icons';

export type FormActionsLayout = 'inline' | 'stacked' | 'bar';

export interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The buttons (Figma: slot `actions`, up to 3), always in reading order: Cancelar first, the primary
   * last. In `stacked` the primary goes on top, and it is moved first in the page too, so the focus
   * order follows what is seen. In `bar`, compact (below 1024), only the last one (the primary) is shown.
   */
  children: ReactNode;
  /**
   * A short supporting sentence beside the actions (Figma: `showHelper` + `helper`). It is a live region
   * (`role="status"`): when it changes (say, "Falta preço e prazo"), it is said without moving focus.
   */
  helper?: ReactNode;
  /**
   * inline (desktop: floats and hugs its content, sentence left, actions right), stacked (phone, a task
   * with no way out in the topbar: edge to edge at the foot, primary full width on top) or bar (the foot of
   * a create form: the SavingBar's skeleton, neutral; expanded from 1024, compact in one row below it)
   * (Figma: `layout`).
   */
  layout?: FormActionsLayout;
  /**
   * `bar` only, with a `helper`: turns the helper into a button that opens what is missing (a Drawer with
   * the checklist), in the compact arrangement only; expanded, the helper stays text (Figma: `showDetails`).
   */
  onDetails?: () => void;
  /** Said after the helper in the details button's accessible name, hidden on screen. */
  detailsLabel?: string;
  /** Whether the panel the details button opens is open (aria-expanded). */
  detailsExpanded?: boolean;
  /** The id of that panel (aria-controls). */
  detailsControls?: string;
}

/**
 * FormActions — Figma [RDS] Actions/FormActions. The actions at the end of a create form or a task,
 * there from the first second. Where it sticks is the page's job: `position: sticky` at the bottom of
 * the scrolling container. Styles: form-actions.css.
 *
 * `layout="bar"` is the foot of a create form: the SavingBar's skeleton (68 expanded, 64 plus the safe area
 * compact, 24 at the sides, the primary in the same place), but neutral: form-actions/bar/background
 * (surface/page) with the hairline form-actions/border on top, never the brand's colour (that is the
 * SavingBar's signal, for a pending edit). Below 1024 (the screen width, as the SavingBar) it is one row:
 * the helper on the left (at most 2 lines; with `onDetails`, the button that opens what is missing) and only
 * the primary on the right.
 *
 * The app's rules around it:
 * - The primary is never disabled: validate on click, show the error on the field and move the focus to the
 *   first pending one.
 * - The scrolling container takes `scroll-padding-bottom` equal to the bar's height plus
 *   `env(safe-area-inset-bottom)`, so a focused field is never hidden behind it (WCAG 2.4.11).
 * - On the phone the bar leaves while the on-screen keyboard is open (it would cover the field being typed).
 * - Compact has no Cancelar: the way out is back or X in the topbar, with an AlertDialog "Sair sem criar?"
 *   ([Continuar editando] [Sair sem criar]) when something was typed. Cancelar can also go in the footer of
 *   the details Drawer.
 */
export function FormActions({
  children,
  helper,
  layout = 'inline',
  onDetails,
  detailsLabel = 'Ver o que falta',
  detailsExpanded,
  detailsControls,
  className,
  ...rest
}: FormActionsProps) {
  const actions = Children.toArray(children);
  const bar = layout === 'bar';
  const details = bar && helper != null && helper !== false && onDetails !== undefined;
  return (
    <div
      {...rest}
      className={['rds-form-actions', `rds-form-actions--${layout}`, className].filter(Boolean).join(' ')}
    >
      {helper && (
        <p
          className={['rds-form-actions__helper', details && 'rds-form-actions__helper--details'].filter(Boolean).join(' ')}
          role="status"
        >
          {bar ? (
            <>
              {/* With details, two renderings of the helper, one shown at a time (display: none takes the other out
                  of the accessibility tree too, so the status is said once): text expanded, a button compact. */}
              <span className="rds-form-actions__text">{helper}</span>
              {details && (
                <button
                  type="button"
                  className="rds-form-actions__details"
                  aria-expanded={detailsExpanded ?? false}
                  aria-controls={detailsControls}
                  onClick={onDetails}
                >
                  <span className="rds-form-actions__text">{helper}</span>
                  <span className="rds-visually-hidden">, {detailsLabel}</span>
                  <span className="rds-form-actions__icon" aria-hidden="true">
                    <ChevronUpIcon />
                  </span>
                </button>
              )}
            </>
          ) : (
            helper
          )}
        </p>
      )}
      <div className="rds-form-actions__actions">{layout === 'stacked' ? actions.reverse() : actions}</div>
    </div>
  );
}
