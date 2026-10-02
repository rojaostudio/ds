// Shared by Toggle and ToggleGroupItem. Not exported from the package.

/** Figma calls this property `style`: ghost in a toolbar, outline when it stands alone. */
export type ToggleVariant = 'ghost' | 'outline';

export function toggleClassName(variant: ToggleVariant, extra?: string) {
  return ['rds-toggle', `rds-toggle--${variant}`, extra].filter(Boolean).join(' ');
}

/** A toggle without visible text needs a name, or a screen reader only says "toggle button". */
export function warnIfUnnamed(component: string, hasText: boolean, ariaLabel: unknown, ariaLabelledBy: unknown) {
  if (!hasText && !ariaLabel && !ariaLabelledBy) {
    console.warn(`[@rojaostudio/ds] ${component} without text needs aria-label.`);
  }
}
