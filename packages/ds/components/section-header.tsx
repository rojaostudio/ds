import type { ReactNode } from 'react';
import { PageHeader } from './page-header';

/**
 * SectionHeader — deprecated: a thin wrapper over the PageHeader (Figma [RDS] Navigation/PageHeader) with an h2
 * title, kept because SettingsList composes it and the products still use it. New code uses
 * `<PageHeader titleAs="h2" title description actions />`.
 *
 * action → actions. eyebrow and number (not in the Figma) still render as a line above the title. Styles: section-header.css.
 */
export interface SectionHeaderProps {
  /** Small uppercase line above the title (overline). */
  eyebrow?: string;
  /** Section or step number, before the eyebrow: "02 · CONTEÚDO". */
  number?: string;
  title: string;
  description?: string;
  /** Slot on the right of the title (an action, a badge). */
  action?: ReactNode;
  className?: string;
}

/** @deprecated Use PageHeader with titleAs="h2". */
export function SectionHeader({ eyebrow, number, title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={['rds-section-header', className].filter(Boolean).join(' ')}>
      {eyebrow && <p className="rds-section-header__eyebrow">{number ? `${number} · ${eyebrow}` : eyebrow}</p>}
      <PageHeader titleAs="h2" title={title} description={description} actions={action} />
    </div>
  );
}
