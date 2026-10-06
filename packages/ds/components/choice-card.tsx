'use client';

import { ChoiceCardControl, type ChoiceCardProps } from './internal/choice-card';

export { ChoiceCardGroup } from './internal/choice-card';
export type { ChoiceCardProps, ChoiceCardGroupProps, ChoiceCardLayout } from './internal/choice-card';

/**
 * ChoiceCard — Figma [RDS] Content/ChoiceCard. A large single-choice option with icon, label and description, for
 * when each option needs an explanation. Three layouts: row (the line with the radio), tile (a grid cell) and
 * preview (an image on top). It is a native radio: Tab reaches the group, the arrows move and choose, Space
 * chooses. Use it inside a ChoiceCardGroup (one chosen at a time). Styles: choice-card.css.
 */
export function ChoiceCard(props: ChoiceCardProps) {
  return <ChoiceCardControl {...props} />;
}
