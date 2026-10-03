'use client';

import { ToggleCard, type ToggleCardProps } from './toggle-card';

/** @deprecated Use ToggleCardProps (with layout="compact"). */
export type ToggleCardCompactProps = Omit<ToggleCardProps, 'layout' | 'children'>;

/**
 * @deprecated Use `<ToggleCard layout="compact">` (Figma [RDS] Forms/ToggleCard, layout=compact), with the same
 * props. A thin wrapper over it, kept so the old name keeps compiling; the codemod rewrites it.
 */
export function ToggleCardCompact(props: ToggleCardCompactProps) {
  return <ToggleCard {...props} layout="compact" />;
}
