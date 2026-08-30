import type { ReactNode, ComponentType } from 'react';

/**
 * BlockerCard — destaque bloqueante. Mostra que algo precisa de atenção pra
 * o usuário poder seguir (limite atingido, plano expirado, feature gateada).
 *
 * Uso:
 *   <BlockerCard
 *     title="Limite de produtos atingido"
 *     description="Você usou 50/50. Faça upgrade pra cadastrar mais."
 *     action="Ver planos"
 *     actionHref="/billing"
 *   />
 *
 * Pra Next.js, passa `linkAs={Link}` pra usar next/link em vez de `<a>`.
 */

export type BlockerCardTone = 'danger' | 'warning' | 'info';

export interface BlockerCardProps {
  title:        string;
  description:  ReactNode;
  /** Label do botão de ação (opcional). */
  action?:      string;
  /** URL/link da ação. Se ausente e `onAction` definido, vira botão. */
  actionHref?:  string;
  /** Handler de ação (se preferir click handler em vez de href). */
  onAction?:    () => void;
  /** Tom semântico. default = "danger". */
  tone?:        BlockerCardTone;
  /** Eyebrow text antes do título (ex: "Bloqueio", "Limite"). */
  eyebrow?:     string;
  /** Component de link customizado (ex: next/link). default = `<a>`. */
  linkAs?:      ComponentType<{ href: string; className?: string; children: ReactNode }>;
  className?:   string;
}

const TONE: Record<BlockerCardTone, { container: string; eyebrow: string; action: string }> = {
  danger: {
    container: 'border-danger-border bg-danger-soft',
    eyebrow:   'text-danger-text',
    action:    'border-danger-border bg-surface-default text-danger-text hover:bg-danger-soft',
  },
  warning: {
    container: 'border-warning-border bg-warning-soft',
    eyebrow:   'text-warning-text',
    action:    'border-warning-border bg-surface-default text-warning-text hover:bg-warning-soft',
  },
  info: {
    container: 'border-info-border bg-info-soft',
    eyebrow:   'text-info-text',
    action:    'border-info-border bg-surface-default text-info-text hover:bg-info-soft',
  },
};

const DEFAULT_EYEBROW: Record<BlockerCardTone, string> = {
  danger:  'Bloqueio',
  warning: 'Atenção',
  info:    'Aviso',
};

function DefaultLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return <a href={href} className={className}>{children}</a>;
}

export function BlockerCard({
  title,
  description,
  action,
  actionHref,
  onAction,
  tone = 'danger',
  eyebrow,
  linkAs: LinkAs = DefaultLink,
  className = '',
}: BlockerCardProps) {
  const palette = TONE[tone];
  const eyebrowText = eyebrow ?? DEFAULT_EYEBROW[tone];
  const actionClass = ['shrink-0 rounded-(--radius-card) border px-3 py-1.5 text-caption font-medium transition-colors whitespace-nowrap', palette.action].join(' ');

  return (
    <div className={['rounded-(--radius-card) border p-4', palette.container, className].join(' ')}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className={['text-caption font-semibold uppercase tracking-wide', palette.eyebrow].join(' ')}>
            {eyebrowText}
          </span>
          <p className="mt-0.5 font-semibold text-fg-primary text-label">{title}</p>
          <div className="mt-0.5 text-label text-fg-secondary">{description}</div>
        </div>
        {action && actionHref && (
          <LinkAs href={actionHref} className={actionClass}>
            {action}
          </LinkAs>
        )}
        {action && !actionHref && onAction && (
          <button type="button" onClick={onAction} className={actionClass}>
            {action}
          </button>
        )}
      </div>
    </div>
  );
}
