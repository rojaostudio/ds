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
  /** Ignored: the ChoiceCard has no locked state. */
  locked?: boolean;
  disabled?: boolean;
  /** Ignored: the ChoiceCard has no badge on the picture. */
  badge?: ReactNode;
  /** Ignored: the picture is always 16:9. */
  previewAspect?: 'square' | 'video' | 'wide';
  className?: string;
}

/**
 * @deprecated Use ChoiceCard with layout="preview" (Figma [RDS] Content/ChoiceCard). A thin wrapper over it: `label`
 * is the children. It is a native radio now, not a toggle button; `locked`, `badge` and `previewAspect` are ignored.
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
