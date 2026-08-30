'use client';

import { ChatBubble } from './chat-bubble';

export interface TypingIndicatorProps {
  ariaLabel?: string;
}

export function TypingIndicator({ ariaLabel = 'Digitando' }: TypingIndicatorProps) {
  const dotStyle = (delay: string) => ({
    width: 'var(--typing-dot-size)',
    height: 'var(--typing-dot-size)',
    background: 'var(--typing-dot-color)',
    borderRadius: '9999px',
    animation: 'rojao-typing-pulse 1400ms infinite',
    animationDelay: delay,
  });

  return (
    <ChatBubble variant="bot" ariaLabel={ariaLabel}>
      <span
        className="inline-flex items-center"
        style={{ gap: 'var(--typing-dot-gap)' }}
        aria-live="polite"
      >
        <span style={dotStyle('0ms')} />
        <span style={dotStyle('200ms')} />
        <span style={dotStyle('400ms')} />
      </span>
    </ChatBubble>
  );
}
