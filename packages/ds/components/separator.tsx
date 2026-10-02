import type { HTMLAttributes } from 'react';

export type SeparatorOrientation = 'horizontal' | 'vertical';

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  /** horizontal between blocks; vertical between items on the same line. */
  orientation?: SeparatorOrientation;
  /**
   * true (default): only visual, hidden from screen readers.
   * false: it separates sections, announced as role="separator".
   */
  decorative?: boolean;
}

/**
 * Separator — Figma [RDS] Content/Separator. A thin line between groups of content. Prefer
 * space: use the line only when space alone is not enough. Styles: separator.css.
 */
export function Separator({ orientation = 'horizontal', decorative = true, className, ...rest }: SeparatorProps) {
  const semantics = decorative
    ? { role: 'none' as const, 'aria-hidden': true }
    : { role: 'separator' as const, 'aria-orientation': orientation === 'vertical' ? ('vertical' as const) : undefined };
  return (
    <div
      {...semantics}
      {...rest}
      className={['rds-separator', `rds-separator--${orientation}`, className].filter(Boolean).join(' ')}
    />
  );
}
