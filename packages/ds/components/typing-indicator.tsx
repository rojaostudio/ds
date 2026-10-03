import { Bubble } from './bubble';

/** @deprecated Use Bubble with `typing`. */
export interface TypingIndicatorProps {
  /** What a screen reader hears. Default "Digitando". */
  ariaLabel?: string;
}

/**
 * @deprecated Use `<Bubble typing />` (Figma [RDS] Chat/Bubble, typing=true). A thin wrapper over it: the
 * label becomes the bubble's announcement.
 */
export function TypingIndicator({ ariaLabel = 'Digitando' }: TypingIndicatorProps) {
  return (
    <Bubble typing align="start">
      {ariaLabel}
    </Bubble>
  );
}
