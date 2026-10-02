import type { HTMLAttributes } from 'react';

export interface StepProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The step the person is on, from 1 (Figma: `step`, "2 of 4"). */
  step: number;
  /** How many steps the flow has (Figma: the "of 4"). */
  total: number;
  /** The bar's name for screen readers: what the flow is. */
  'aria-label'?: string;
}

/**
 * StepProgress — Figma [RDS] Indicators/StepProgress. The thin bar of a flow in steps (sign-up, onboarding): how much
 * is done. It has no text; "Passo 2 de 4" goes outside, in the title. Read as a progressbar, "Passo 2 de 4".
 * Named steps are the Stepper. Styles: step-progress.css.
 */
export function StepProgress({ step, total, className, 'aria-label': ariaLabel = 'Progresso', ...rest }: StepProgressProps) {
  const safeTotal = Math.max(1, total);
  const current = Math.min(Math.max(step, 0), safeTotal);
  return (
    <div
      {...rest}
      className={['rds-step-progress', className].filter(Boolean).join(' ')}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-valuetext={`Passo ${current} de ${safeTotal}`}
    >
      <div className="rds-step-progress__fill" style={{ width: `${(current / safeTotal) * 100}%` }} />
    </div>
  );
}
