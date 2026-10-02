import type { HTMLAttributes, ReactNode } from 'react';

export type ButtonGroupOrientation = 'horizontal' | 'vertical';

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** The sibling actions (Figma: slot `buttons`): Buttons of the same tone and variant, up to 4. */
  children: ReactNode;
  /** In a row or stacked (Figma: `orientation`). */
  orientation?: ButtonGroupOrientation;
  /** Required: what the actions act on ("Rascunho"). The group is announced with this name. */
  'aria-label': string;
}

/**
 * ButtonGroup — Figma [RDS] Actions/ButtonGroup. Buttons joined in one piece: inner corners square,
 * borders overlapping by 1px. Each Button stays in the tab order. Styles: button-group.css.
 */
export function ButtonGroup({ orientation = 'horizontal', className, children, ...rest }: ButtonGroupProps) {
  return (
    <div
      {...rest}
      role="group"
      className={['rds-button-group', `rds-button-group--${orientation}`, className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
