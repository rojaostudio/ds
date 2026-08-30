'use client';

import { useState, useEffect } from 'react';

export type CopilotHintPriority = 'high' | 'medium' | 'low';

export interface CopilotHintProps {
  id: string;
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  dismissible?: boolean;
  priority?: CopilotHintPriority;
  className?: string;
}

export function CopilotHint({
  id,
  title,
  description,
  cta,
  dismissible = true,
  priority = 'medium',
  className = '',
}: CopilotHintProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(`copilot-dismissed:${id}`) === '1');
  }, [id]);

  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem(`copilot-dismissed:${id}`, '1');
    setDismissed(true);
  }

  return (
    <div
      className={[
        'rounded-(--radius-card) border bg-(--surface-raised) p-4 flex gap-3',
        priority === 'high' ? 'border-brand-primary' : 'border-stroke-default',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {priority === 'high' && (
        <div className="w-1 self-stretch rounded-full bg-(--brand-primary) shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-label font-medium text-(--text-primary)">{title}</p>
        {description && (
          <p className="text-caption text-(--text-muted) mt-0.5 leading-relaxed">{description}</p>
        )}
        {cta && (
          <a
            href={cta.href}
            className="mt-2 inline-flex text-caption font-medium text-(--brand-primary) hover:underline"
          >
            {cta.label} →
          </a>
        )}
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dispensar"
          className="text-(--text-disabled) hover:text-(--text-secondary) transition-colors shrink-0 self-start"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
