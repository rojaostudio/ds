'use client';

import type { ReactNode } from 'react';

export interface FormCardHeaderProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Slot à direita (ação, badge) — alinhado ao centro vertical do bloco. */
  action?: ReactNode;
}

// Cabeçalho de seção: ícone em "chip" (quadrado arredondado, fundo primary + ícone
// on-primary, via tokens de marca — multi-brand e com contraste
// garantido nos dois modos) + título + subtítulo. O gap header→conteúdo é o pb-3 (12px)
// — vive AQUI, reflete em toda tela.
export function FormCardHeader({ icon, title, subtitle, action }: FormCardHeaderProps) {
  return (
    <div className="flex items-center gap-3 pb-3">
      {icon && (
        <span className="grid place-items-center shrink-0 size-9 rounded-(--radius-card) bg-brand-primary text-brand-on-primary">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-label font-semibold text-(--text-primary)">{title}</p>
        {subtitle && <p className="text-caption text-(--text-muted) mt-1 leading-snug">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
