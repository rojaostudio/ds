import { Children, type HTMLAttributes, type ReactNode } from 'react';

export type FormActionsLayout = 'inline' | 'stacked';

export interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The buttons (Figma: slot `actions`, up to 3), always in reading order: Cancelar first, the primary
   * last. In `stacked` the primary goes on top, and it is moved first in the page too, so the focus
   * order follows what is seen.
   */
  children: ReactNode;
  /** A short supporting sentence beside the actions (Figma: `showHelper` + `helper`). */
  helper?: ReactNode;
  /**
   * inline (desktop: floats and hugs its content, sentence left, actions right) or stacked (phone: edge
   * to edge at the foot, primary full width on top) (Figma: `layout`).
   */
  layout?: FormActionsLayout;
}

/**
 * FormActions — Figma [RDS] Actions/FormActions. The actions at the end of a create form or a task,
 * there from the first second. Where it sticks is the page's job: `position: sticky` at the bottom of
 * the scrolling container, with `scroll-padding-bottom` equal to its height, so a focused field is never
 * hidden behind it (WCAG 2.4.11). Styles: form-actions.css.
 */
export function FormActions({ children, helper, layout = 'inline', className, ...rest }: FormActionsProps) {
  const actions = Children.toArray(children);
  return (
    <div
      {...rest}
      className={['rds-form-actions', `rds-form-actions--${layout}`, className].filter(Boolean).join(' ')}
    >
      {helper && <p className="rds-form-actions__helper">{helper}</p>}
      <div className="rds-form-actions__actions">{layout === 'stacked' ? actions.reverse() : actions}</div>
    </div>
  );
}
