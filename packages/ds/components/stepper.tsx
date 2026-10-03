'use client';

import type { ReactNode } from 'react';
import { Button } from './button';
import { Card } from './card';
import { Separator } from './separator';

/**
 * Stepper — a composition of the Card (as a pill) and Buttons (Figma [RDS] Actions/Button, neutral): the
 * floating steps of a flow (point of sale, checkout). The current step is the filled Button (aria-current="step");
 * earlier steps go back, later ones are disabled; `canNavigate` changes the rule. `action` is a last Button after
 * a vertical Separator (Reset). Where it floats is the caller's (className or a wrapper). Styles: stepper.css.
 */

export type StepperStep = { key: string; label: string };

export interface StepperProps {
  steps: StepperStep[];
  /** key da etapa atual */
  current: string;
  onNavigate?: (key: string) => void;
  /** Regra de navegação por etapa. Default: só etapas anteriores à atual. */
  canNavigate?: (key: string, index: number, currentIndex: number) => boolean;
  /** Ação à direita, separada por divisor (ex.: Reset). */
  action?: { label: string; icon?: ReactNode; onClick: () => void };
  className?: string;
  /** The navigation's name. Default "Etapas". */
  'aria-label'?: string;
}

export function Stepper({ steps, current, onNavigate, canNavigate, action, className, 'aria-label': ariaLabel = 'Etapas' }: StepperProps) {
  const currentIdx = steps.findIndex((s) => s.key === current);

  return (
    <Card as="div" size="sm" role="navigation" aria-label={ariaLabel} className={['rds-stepper', className].filter(Boolean).join(' ')}>
      {steps.map((s, idx) => {
        const isCurrent = idx === currentIdx;
        const canGo = canNavigate ? canNavigate(s.key, idx, currentIdx) : idx < currentIdx;
        return (
          <Button
            key={s.key}
            tone="neutral"
            variant={isCurrent ? 'fill' : 'ghost'}
            disabled={!canGo && !isCurrent}
            aria-current={isCurrent ? 'step' : undefined}
            onClick={() => {
              if (canGo && !isCurrent) onNavigate?.(s.key);
            }}
          >
            {s.label}
          </Button>
        );
      })}
      {action && (
        <>
          <Separator orientation="vertical" className="rds-stepper__divider" />
          <Button tone="neutral" variant="ghost" icon={action.icon} onClick={action.onClick}>
            {action.label}
          </Button>
        </>
      )}
    </Card>
  );
}
