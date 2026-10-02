'use client';

import { useId, useState, type ReactNode } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from './internal/icons';

export interface SectionCardProps {
  /** The section's name (Figma: `label`), shown in capitals. */
  label: string;
  /** A short summary beside the label (Figma: `hasBadge` + `badge`): "3 campos", "preenchido". */
  badge?: string;
  /** Open (Figma: `open`). Controlled with `onToggle`; leave it out and use `defaultOpen` to let the card decide. */
  open?: boolean;
  /** Open at first, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the new state when the person opens or closes it. */
  onToggle?: (open: boolean) => void;
  /** The heading level that fits the page's heading order. */
  titleAs?: 'h2' | 'h3' | 'h4';
  /** The section's fields. */
  children: ReactNode;
  className?: string;
}

/**
 * SectionCard — Figma [RDS] Content/SectionCard. A form section that opens and closes: a header with the label and a
 * summary, the content under it when open. For long forms, one section open at a time. The header is a heading with
 * a button (aria-expanded, aria-controls). Styles: section-card.css.
 */
export function SectionCard({ label, badge, open, defaultOpen = false, onToggle, titleAs: Title = 'h3', children, className }: SectionCardProps) {
  const [own, setOwn] = useState(defaultOpen);
  const isOpen = open ?? own;
  const contentId = useId();
  return (
    <div className={['rds-section-card', isOpen && 'rds-section-card--open', className].filter(Boolean).join(' ')}>
      <Title className="rds-section-card__heading">
        <button
          type="button"
          className="rds-section-card__header"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => {
            setOwn(!isOpen);
            onToggle?.(!isOpen);
          }}
        >
          <span className="rds-section-card__title">
            <span className="rds-section-card__label">{label}</span>
            {badge && <span className="rds-section-card__badge">{badge}</span>}
          </span>
          <span className="rds-section-card__chevron" aria-hidden="true">
            {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </span>
        </button>
      </Title>
      <div id={contentId} className="rds-section-card__content" hidden={!isOpen}>
        {children}
      </div>
    </div>
  );
}
