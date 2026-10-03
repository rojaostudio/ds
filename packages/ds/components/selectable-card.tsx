'use client';

import type { ReactNode } from 'react';
import { ChoiceCard } from './choice-card';

/** @deprecated Use ChoiceCardProps. */
export interface SelectableCardProps {
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * @deprecated Use ChoiceCard (Figma [RDS] Content/ChoiceCard, layout="row"). A thin wrapper over it: `children`
 * is the label, `onClick` is `onSelect`. It is a native radio now, not a button (`as`, `href`, `indicator` and
 * `ribbon` left in 2.0), and a chosen card cannot be un-chosen by clicking it again.
 */
export function SelectableCard({ selected = false, onClick, disabled, className, children }: SelectableCardProps) {
  return (
    <ChoiceCard layout="row" selected={selected} onSelect={onClick} disabled={disabled} className={className}>
      {children}
    </ChoiceCard>
  );
}
