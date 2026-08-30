'use client';

import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { FormCardHeader } from './form-card-header';

export interface DangerZoneProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

// Zona de risco canônica do admin (Conta, Vitrine, Bio…). O header (chip com ícone de alerta +
// título NEUTRO + subtítulo) fica FORA do painel — reusa o FormCardHeader, então o "Zona de
// risco" nunca mais sai vermelho. O painel é danger-soft. Use DangerZoneItem pros itens: ele
// trava o contraste do texto secundário (text-muted), o ponto que divergia quando cada tela
// escrevia o item à mão.
export function DangerZone({ title, description, children, className = '' }: DangerZoneProps) {
  return (
    <section className={['space-y-4', className].filter(Boolean).join(' ')}>
      {(title || description) && (
        <FormCardHeader
          icon={<AlertTriangle size={18} strokeWidth={1.5} />}
          title={title}
          subtitle={description}
        />
      )}
      <div className="rounded-(--radius-card) border p-5 bg-danger-soft border-danger-border">{children}</div>
    </section>
  );
}

export interface DangerZoneItemProps {
  title: ReactNode;
  description?: ReactNode;
  /** Ação à direita — normalmente um Button variant="outline" color="danger" size="sm". */
  action?: ReactNode;
  className?: string;
}

// Item de zona de risco: título (text-primary) + descrição (text-muted, contraste garantido)
// à esquerda, ação à direita. Vários itens no mesmo painel se separam empilhando com
// `divide-y divide-(--danger-border)` no wrapper.
export function DangerZoneItem({ title, description, action, className = '' }: DangerZoneItemProps) {
  return (
    <div className={['flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0', className].filter(Boolean).join(' ')}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-(--text-primary)">{title}</p>
        {description && <p className="text-xs text-(--text-muted) mt-0.5 leading-relaxed">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
