// Shared by Toggle and ToggleGroupItem. Not exported from the package.

/** The emphasis (Figma: `variant`): ghost in a toolbar, outline when it stands alone. */
export type ToggleVariant = 'ghost' | 'outline';

/** md (default) is 44 tall; sm is 32, with a 16 icon (a 32 square when it has only the icon). */
export type ToggleSize = 'sm' | 'md';

export function toggleClassName(variant: ToggleVariant, size: ToggleSize, iconOnly: boolean, extra?: string) {
  return [
    'rds-toggle',
    `rds-toggle--${variant}`,
    size === 'sm' && 'rds-toggle--sm',
    iconOnly && 'rds-toggle--icon-only',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

/** A toggle without visible text needs a name, or a screen reader only says "toggle button". */
export function warnIfUnnamed(component: string, hasText: boolean, ariaLabel: unknown, ariaLabelledBy: unknown) {
  if (!hasText && !ariaLabel && !ariaLabelledBy) {
    console.warn(`[@rojaostudio/ds] ${component} without text needs aria-label.`);
  }
}
