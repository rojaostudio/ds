'use client';

import type { ReactNode } from 'react';
import {
  Package, Clock, Combine, Boxes, FileText, Users, Wallet,
  CalendarDays, Warehouse, Tag, LayoutGrid, Info, SearchX, Lock,
  Send, HandCoins, Store, BarChart3, CreditCard,
} from 'lucide-react';

// ── Icon map ──────────────────────────────────────────────────────────────────
// As 6 chaves de categoria (catalog/channels/commercial/operation/intelligence/
// billing) servem o Paywall (#372) — ícone por categoria de feature. Reuso, não
// um mapa paralelo.

export const ICON_MAP = {
  box:       Package,
  service:   Clock,
  kit:       Combine,
  input:     Boxes,
  order:     FileText,
  customer:  Users,
  finance:   Wallet,
  schedule:  CalendarDays,
  inventory: Warehouse,
  price:     Tag,
  category:  LayoutGrid,
  generic:   Info,
  search:    SearchX,
  lock:      Lock,
  // Categorias de feature (Paywall) ──
  catalog:      Package,
  channels:     Send,
  commercial:   HandCoins,
  operation:    Store,
  intelligence: BarChart3,
  billing:      CreditCard,
} as const;

export type EmptyStateIcon = keyof typeof ICON_MAP;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EmptyStateCta {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface EmptyStateProps {
  icon?: EmptyStateIcon;
  title: string;
  description?: string;
  cta?: EmptyStateCta;
  /**
   * full   = fills available height (use inside page containers)
   * compact = inline fit with vertical padding
   */
  size?: 'full' | 'compact';
  children?: ReactNode;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EmptyState({
  icon = 'generic',
  title,
  description,
  cta,
  size = 'full',
  children,
  className = '',
}: EmptyStateProps) {
  const Icon = ICON_MAP[icon];

  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center px-6',
        size === 'full' ? 'min-h-[320px] flex-1' : 'min-h-[200px] py-10',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className="mb-5 text-stroke-strong">
        <Icon size={72} strokeWidth={1.25} />
      </div>
      <p className="text-body font-semibold text-fg-primary mb-2">
        {title}
      </p>
      {description && (
        <p className="text-label text-fg-muted max-w-sm leading-relaxed mb-4">
          {description}
        </p>
      )}
      {cta && (
        cta.href ? (
          <a
            href={cta.href}
            className="mt-3 inline-block px-4 py-2 text-label font-medium rounded-(--radius-card) transition-colors text-brand-on-primary bg-brand-primary hover:bg-brand-hover"
          >
            {cta.label}
          </a>
        ) : (
          <button
            type="button"
            onClick={cta.onClick}
            className="mt-3 inline-block px-4 py-2 text-label font-medium rounded-(--radius-card) transition-colors text-brand-on-primary bg-brand-primary hover:bg-brand-hover"
          >
            {cta.label}
          </button>
        )
      )}
      {children}
    </div>
  );
}
