'use client';

import type { ReactNode } from 'react';

/**
 * FloatingStepper — pill flutuante de etapas de um fluxo (PDV, checkout).
 *
 * Mostra as etapas com dot de estado; etapas anteriores são navegáveis
 * (volta no fluxo), futuras ficam desabilitadas. `canNavigate` permite
 * customizar a regra. Slot `action` pra ação terminal (ex.: Reset).
 *
 * O POSICIONAMENTO é do caller (absolute/fixed via wrapper ou className) —
 * o componente só renderiza a pill.
 *
 * Uso:
 *   <FloatingStepper
 *     steps={[{ key: 'cart', label: 'Carrinho' }, ...]}
 *     current={step}
 *     onNavigate={setStep}
 *     action={{ label: 'Reset', icon: <RotateCcw />, onClick: reset }}
 *     className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30"
 *   />
 */

export type FloatingStepperStep = { key: string; label: string };

export interface FloatingStepperProps {
  steps: FloatingStepperStep[];
  /** key da etapa atual */
  current: string;
  onNavigate?: (key: string) => void;
  /** Regra de navegação por etapa. Default: só etapas anteriores à atual. */
  canNavigate?: (key: string, index: number, currentIndex: number) => boolean;
  /** Ação à direita, separada por divisor (ex.: Reset). */
  action?: { label: string; icon?: ReactNode; onClick: () => void };
  className?: string;
}

export function FloatingStepper({
  steps,
  current,
  onNavigate,
  canNavigate,
  action,
  className = '',
}: FloatingStepperProps) {
  const currentIdx = steps.findIndex((s) => s.key === current);

  return (
    <div
      className={[
        'flex items-center gap-0.5 rounded-full bg-surface-shell shadow-2xl px-1.5 py-1.5',
        className,
      ].filter(Boolean).join(' ')}
    >
      {steps.map((s, idx) => {
        const isCurrent = idx === currentIdx;
        const canGo = canNavigate ? canNavigate(s.key, idx, currentIdx) : idx < currentIdx;
        return (
          <button
            key={s.key}
            type="button"
            disabled={!canGo && !isCurrent}
            aria-current={isCurrent ? 'step' : undefined}
            onClick={() => { if (canGo) onNavigate?.(s.key); }}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-medium whitespace-nowrap transition-colors ${
              isCurrent
                ? 'bg-(--surface-default) text-(--text-primary)'
                : canGo
                  ? 'text-on-shell-muted hover:text-on-shell'
                  : 'text-on-shell-subtle cursor-default'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCurrent ? 'bg-(--text-primary)' : 'bg-on-shell-subtle'}`} />
            {s.label}
          </button>
        );
      })}
      {action && (
        <>
          <span className="w-px h-4 bg-on-shell-line mx-1" aria-hidden />
          <button
            type="button"
            onClick={action.onClick}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-medium text-on-shell-muted hover:text-on-shell transition-colors whitespace-nowrap [&_svg]:w-3 [&_svg]:h-3 [&_svg]:shrink-0"
          >
            {action.icon}
            {action.label}
          </button>
        </>
      )}
    </div>
  );
}
