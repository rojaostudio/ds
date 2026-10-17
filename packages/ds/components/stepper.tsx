'use client';

import type { ReactNode } from 'react';
import { Button } from './button';
import { Card } from './card';
import { Separator } from './separator';

/**
 * Stepper — Figma [RDS] Navigation/Stepper. A composition of the Card (as a pill) and Buttons (neutral): the steps of
 * a flow (point of sale, checkout, a wizard). A navigation named "Etapas" holding an ordered list, so a screen reader
 * says how many steps there are; each step says its position after its label ("Endereço, etapa 2 de 4"). The current
 * step is the filled Button (aria-current="step"); earlier steps go back, later ones are aria-disabled (readable and
 * reachable by Tab, they do nothing); `canNavigate` changes the rule. `action` is a last Button after a vertical
 * Separator (Reset), outside the list. floating (the default) is the raised pill over the page; embedded has no
 * surface, border or shadow, for a Stepper inside a Dialog or a card. Where it floats is the caller's. Styles:
 * stepper.css.
 */

export type StepperStep = { key: string; label: string };

/** floating: the raised pill over the page (the default); embedded: no surface, border or shadow (inside a Dialog). */
export type StepperVariant = 'floating' | 'embedded';

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
  /** floating (default) or embedded (Figma: `variant`, ds#159). */
  variant?: StepperVariant;
  /** The position each step says after its label, for screen readers. Default "etapa 2 de 4". */
  positionLabel?: (position: number, total: number) => string;
}

const defaultPosition = (position: number, total: number) => `etapa ${position} de ${total}`;

export function Stepper({
  steps,
  current,
  onNavigate,
  canNavigate,
  action,
  className,
  'aria-label': ariaLabel = 'Etapas',
  variant = 'floating',
  positionLabel = defaultPosition,
}: StepperProps) {
  const currentIdx = steps.findIndex((s) => s.key === current);

  return (
    <Card
      as="div"
      size="sm"
      role="navigation"
      aria-label={ariaLabel}
      className={['rds-stepper', `rds-stepper--${variant}`, className].filter(Boolean).join(' ')}
    >
      <ol className="rds-stepper__list">
        {steps.map((s, idx) => {
          const isCurrent = idx === currentIdx;
          const canGo = canNavigate ? canNavigate(s.key, idx, currentIdx) : idx < currentIdx;
          return (
            <li key={s.key} className="rds-stepper__item">
              <Button
                tone="neutral"
                variant={isCurrent ? 'fill' : 'ghost'}
                disabled={!canGo && !isCurrent}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => {
                  if (canGo && !isCurrent) onNavigate?.(s.key);
                }}
              >
                {s.label}
                <span className="rds-visually-hidden">, {positionLabel(idx + 1, steps.length)}</span>
              </Button>
            </li>
          );
        })}
      </ol>
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
