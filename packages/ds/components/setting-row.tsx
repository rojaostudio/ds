import type { ReactNode } from 'react';

/**
 * SettingRow — uma linha de configuração: título + texto de apoio à ESQUERDA,
 * controle à DIREITA. Padrão "Settings" (rows com divisor, no lugar de card-por-item).
 * Empilha no mobile (label em cima, controle embaixo). Os divisores entre rows são
 * aplicados pelo <SettingsList> que as agrupa — a row nunca desenha a própria borda.
 *
 * controlWidth:
 *   'auto' — controle estreito encostado à direita (toggle, pill, dropdown curto). DEFAULT.
 *   'fill' — input/select que ocupa uma coluna de largura previsível (até ~20rem).
 *   'full' — controle LARGO (fileira de <ChoicePreviewCard>): largura total, sempre abaixo do label.
 *
 * a11y: passe `htmlFor` quando o controle for um input/toggle único — o label vira
 * <label> associado (sem isso, leitores de tela não associam rótulo↔controle).
 */
export interface SettingRowProps {
  label: ReactNode;
  description?: ReactNode;
  /** Ícone opcional à esquerda do label. */
  icon?: ReactNode;
  /** id do controle — associa o label (htmlFor) pra leitores de tela. */
  htmlFor?: string;
  controlWidth?: 'auto' | 'fill' | 'full';
  /** Alinhamento vertical do controle vs. label. 'start' p/ textarea/multilinha. */
  align?: 'center' | 'start';
  control: ReactNode;
  className?: string;
}

export function SettingRow({
  label,
  description,
  icon,
  htmlFor,
  controlWidth = 'auto',
  align = 'center',
  control,
  className = '',
}: SettingRowProps) {
  const cols =
    controlWidth === 'full'
      ? '' // grid-cols-1 (default) — controle desce pra baixo do label
      : controlWidth === 'fill'
        ? 'sm:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]'
        : 'sm:grid-cols-[1fr_auto]';
  const alignCls = align === 'start' ? 'sm:items-start' : 'sm:items-center';
  const LabelTag = htmlFor ? 'label' : 'div';

  return (
    <div className={['grid grid-cols-1 gap-x-6 gap-y-3 py-4', cols, alignCls, className].filter(Boolean).join(' ')}>
      <div className="flex items-start gap-3 min-w-0">
        {icon && <div className="shrink-0 text-fg-muted mt-0.5">{icon}</div>}
        <div className="min-w-0">
          <LabelTag htmlFor={htmlFor} className="block text-sm font-medium text-fg-primary">{label}</LabelTag>
          {description && <div className="text-sm text-fg-muted mt-0.5 leading-snug">{description}</div>}
        </div>
      </div>
      <div className={controlWidth === 'auto' ? 'sm:justify-self-end' : ''}>{control}</div>
    </div>
  );
}
