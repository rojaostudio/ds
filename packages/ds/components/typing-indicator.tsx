import { Bubble } from './bubble';

/** @deprecated Use Bubble with variant="typing". */
export interface TypingIndicatorProps {
  /** What a screen reader hears. Default "Digitando". */
  ariaLabel?: string;
}

/**
 * @deprecated Use `<Bubble variant="typing" />` (Figma [RDS] Chat/Bubble, style=typing). A thin wrapper over it: the
 * label becomes the bubble's announcement.
 */
export function TypingIndicator({ ariaLabel = 'Digitando' }: TypingIndicatorProps) {
  return (
    <Bubble variant="typing" align="start">
      {ariaLabel}
    </Bubble>
  );
}
