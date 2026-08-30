export interface StepProgressProps {
  /** Zero-based current step index */
  current: number;
  /** Total number of steps */
  total: number;
  className?: string;
}

export function StepProgress({ current, total, className = '' }: StepProgressProps) {
  const pct = Math.round(((current + 1) / total) * 100);
  // Cores via tokens semânticos DIRETOS (border-strong/brand-primary), não via
  // --step-progress-* indireto: custom property com var() resolve no elemento onde é
  // declarada (:root), então component tokens indiretos congelavam no valor do root
  // (branco em :root.dark) e o tema light injetado num wrapper aninhado nunca os alcançava.
  return (
    <div
      className={['w-full h-1.5 rounded-full overflow-hidden [background:var(--border-subtle)]', className].join(' ')}
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      <div
        className="h-full rounded-full transition-all duration-300 ease-out [background:var(--brand-primary)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
