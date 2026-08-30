import type { ReactNode } from 'react';
import { SectionHeader } from './section-header';

/**
 * SettingsList — agrupa <SettingRow> num bloco com divisores entre elas. Substitui o
 * boilerplate repetido `Card > CardBody noPadding > div.divide-y` espalhado pelas telas.
 *
 * O título do grupo é simples (sem número/eyebrow) — o padrão "Settings" não numera
 * seções (são ajustes paralelos, não etapas). Divisor = `stroke-default` (visível, não o
 * `stroke-subtle` quase invisível do Untitled UI) — acessibilidade > estética de Figma.
 */
export interface SettingsListProps {
  /** Título simples do grupo. Omita se o grupo não tem cabeçalho. */
  title?: string;
  description?: string;
  /** Ação à direita do título (delega ao SectionHeader). */
  action?: ReactNode;
  /** Moldura (card) em volta. Default true; false = lista solta. */
  framed?: boolean;
  children: ReactNode;
  className?: string;
}

export function SettingsList({
  title,
  description,
  action,
  framed = true,
  children,
  className = '',
}: SettingsListProps) {
  const list = (
    <div
      className={
        framed
          ? 'rounded-(--radius-card) border border-stroke-default bg-surface-default px-4 [&>*]:border-t [&>*]:border-stroke-default [&>*:first-child]:border-t-0'
          : '[&>*]:border-t [&>*]:border-stroke-default [&>*:first-child]:border-t-0'
      }
    >
      {children}
    </div>
  );

  return (
    <section className={['space-y-3', className].filter(Boolean).join(' ')}>
      {title && <SectionHeader title={title} description={description} action={action} />}
      {list}
    </section>
  );
}
