'use client';

import type { ReactNode, MouseEvent } from 'react';

export type ChatBubbleVariant = 'bot' | 'user';
export type ChatBubbleState = 'sent' | 'editing' | 'pending';

export interface ChatBubbleProps {
  variant: ChatBubbleVariant;
  state?: ChatBubbleState;
  dim?: boolean;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  children: ReactNode;
  ariaLabel?: string;
}

export function ChatBubble({
  variant,
  state = 'sent',
  dim = false,
  onClick,
  children,
  ariaLabel,
}: ChatBubbleProps) {
  const isBot = variant === 'bot';
  const interactive = !!onClick && !dim;

  const wrapperClass = [
    'w-full flex',
    isBot ? 'justify-start' : 'justify-end',
  ].join(' ');

  const bubbleClass = [
    'inline-block max-w-[var(--chat-bubble-max-width)]',
    'px-[var(--chat-bubble-padding-x)] py-[var(--chat-bubble-padding-y)]',
    'text-[length:var(--font-size-body)] leading-[var(--line-height-body)]',
    'transition-all',
    isBot
      ? 'bg-[var(--chat-bubble-bot-bg)] text-[var(--chat-bubble-bot-text)]'
      : 'bg-[var(--chat-bubble-user-bg)] text-[var(--chat-bubble-user-text)]',
    dim ? 'opacity-[var(--chat-bubble-dim-opacity)] pointer-events-none' : '',
    state === 'editing' ? 'ring-2 ring-[var(--chat-bubble-editing-border)] ring-offset-1' : '',
    interactive ? 'cursor-pointer hover:brightness-95' : '',
  ].filter(Boolean).join(' ');

  const radiusStyle = isBot
    ? {
        borderRadius: 'var(--chat-bubble-radius-lg)',
        borderTopLeftRadius: 'var(--chat-bubble-radius-sm)',
      }
    : {
        borderRadius: 'var(--chat-bubble-radius-lg)',
        borderBottomRightRadius: 'var(--chat-bubble-radius-sm)',
      };

  return (
    <div className={wrapperClass}>
      <div
        className={bubbleClass}
        style={radiusStyle}
        onClick={interactive ? onClick : undefined}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.(e as unknown as MouseEvent<HTMLDivElement>);
                }
              }
            : undefined
        }
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  );
}
