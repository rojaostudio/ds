import type { ReactNode } from 'react';

/**
 * SectionHeader — cabeçalho de seção fora de card: eyebrow (overline) opcional
 * + título + texto de apoio. Areja a página agrupando conteúdo sem moldura.
 *
 * Uso:
 *   <SectionHeader title="Seções da vitrine" />
 *   <SectionHeader eyebrow="Conteúdo da vitrine" number="02" title="Seções da vitrine" description="Ative, desative e edite o que aparece" />
 *   <SectionHeader title="Zonas" action={<Button size="sm">Adicionar</Button>} />
 *
 * O eyebrow consome os tokens --font-size/weight/letter-spacing-eyebrow — a
 * decisão de "quão pequeno/espaçado" vive em base.css, não em cada tela.
 */
export interface SectionHeaderProps {
  /** Micro-rótulo uppercase acima do título (overline/kicker). */
  eyebrow?: string;
  /** Número de seção/etapa — prefixa o eyebrow: "02 · CONTEÚDO". */
  number?: string;
  title: string;
  description?: string;
  /** Slot à direita do título (ação, badge). */
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ eyebrow, number, title, description, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={['mb-6', className].filter(Boolean).join(' ')}>
      {/* Dois grupos: eyebrow ocupa a linha inteira; abaixo, título+descrição à
          esquerda com o action centralizado verticalmente em relação a ELES. */}
      {eyebrow && (
        <p className="uppercase text-fg-muted mb-1.5 [font-size:var(--font-size-eyebrow)] [font-weight:var(--font-weight-eyebrow)] [letter-spacing:var(--letter-spacing-eyebrow)]">
          {number ? `${number} · ${eyebrow}` : eyebrow}
        </p>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-body font-semibold text-fg-primary">{title}</h2>
          {description && <p className="text-label text-fg-muted mt-1">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
