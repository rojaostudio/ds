'use client';

import type { ReactNode } from 'react';
import { ChoiceCard } from './choice-card';

/** @deprecated Use ChoiceCardProps. */
export interface ChoicePreviewCardProps {
  selected: boolean;
  onSelect: () => void;
  /** The picture on top. */
  preview: ReactNode;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * @deprecated Use ChoiceCard with layout="preview" (Figma [RDS] Content/ChoiceCard). A thin wrapper over it: `label`
 * is the children. It is a native radio now, not a toggle button (`locked`, `badge` and `previewAspect` left in 2.0).
 */
export function ChoicePreviewCard({ selected, onSelect, preview, label, description, disabled, className }: ChoicePreviewCardProps) {
  return (
    <ChoiceCard
      layout="preview"
      selected={selected}
      onSelect={onSelect}
      preview={preview}
      description={description}
      disabled={disabled}
      className={className}
    >
      {label}
    </ChoiceCard>
  );
}
