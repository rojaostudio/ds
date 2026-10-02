/**
 * Blocks test helpers (2.0, #17): a block in a container of a given width. The viewport stays the same: what changes
 * the layout is the container (the Figma `screen` desktop · mobile as a container query).
 */
import type { ReactNode } from 'react';

/** 360: the Figma mobile frame; 1024: a desktop column. Both inside the same viewport. */
export const WIDTHS = [360, 1024] as const;
export type Width = (typeof WIDTHS)[number];

export function InContainer({ width, children }: { width: number; children: ReactNode }) {
  return (
    <div data-container style={{ width }}>
      {children}
    </div>
  );
}
