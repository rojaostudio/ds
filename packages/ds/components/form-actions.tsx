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
   * A short supporting sentence beside the actions (Figma: `helper`). It is a live region
   * (`role="status"`): when it changes (say, "Falta preço e prazo"), it is said without moving focus.
   * In `bar` with `onDetails`, it is also the text of the details button (compact), even when
   * `showHelper` is false.
   */
  helper?: ReactNode;
  /**
   * Whether the `helper` is shown as static text (Figma: `showHelper`; default `true`). It governs only the
   * static text: expanded when `showHelper && helper`, compact when `showHelper && helper && !onDetails`. In
   * `bar` with `onDetails`, the compact details button always shows the `helper`, whatever this says; with
   * `showHelper={false}` the expanded bar shows no sentence (the create form's checklist is in the right
   * column on the desktop), and the `role="status"` keeps saying its changes from a visually hidden copy.
   * Without `onDetails`, `false` leaves the helper out entirely.
   */
  showHelper?: boolean;
  /**
   * inline (desktop: floats and hugs its content, sentence left, actions right), stacked (phone, a task
   * with no way out in the topbar: edge to edge at the foot, primary full width on top) or bar (the foot of
   * a create form: the SavingBar's skeleton, neutral; expanded from 1024, compact in one row below it)
   * (Figma: `layout`).
   */
  layout?: FormActionsLayout;
  /**
   * `bar` only, with a `helper`: in the compact arrangement the helper is always a button (its text and a
   * chevron) that opens what is missing (a Drawer with the checklist), even with `showHelper={false}`;
   * expanded, the helper stays text, shown only with `showHelper` (Figma: `showDetails`).
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
 * The create form's foot: `<FormActions layout="bar" helper="Falta preço e prazo" showHelper={false}
 * onDetails={…}>`. Expanded it is Cancelar + the primary, no sentence (the checklist is in the right column);
 * compact it is "Falta preço e prazo ˄" (the details button) + the primary.
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
  showHelper = true,
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
  const hasHelper = helper != null && helper !== false && helper !== '';
  const details = bar && hasHelper && onDetails !== undefined;
  // The static text: shown when showHelper (compact with details, CSS swaps it for the button).
  const text = hasHelper && showHelper;
  return (
    <div
      {...rest}
      className={['rds-form-actions', `rds-form-actions--${layout}`, className].filter(Boolean).join(' ')}
    >
      {(text || details) && (
        <p
          className={['rds-form-actions__helper', details && 'rds-form-actions__helper--details'].filter(Boolean).join(' ')}
          role="status"
        >
          {bar ? (
            <>
              {/* Up to three renderings of the helper inside the one status, exactly one rendered at a time
                  (display: none takes the others out of the accessibility tree too, so a change is said once):
                  the text (showHelper; compact with details it gives way to the button), the details button
                  (compact) and, with showHelper off, a visually hidden copy where the button is not shown
                  (expanded), so the status keeps saying the changes. */}
              {text && <span className="rds-form-actions__text">{helper}</span>}
              {details && !showHelper && <span className="rds-visually-hidden rds-form-actions__quiet">{helper}</span>}
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
