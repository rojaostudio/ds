import type { ReactNode } from 'react';

export type CardVariant = 'outlined' | 'elevated' | 'filled' | 'flat' | 'invert';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:    CardVariant;
  /** Renderiza como botão clicável (link card). default = false. */
  interactive?: boolean;
}

// M3 color roles:
//   outlined → colorSurface + colorOutline (1dp stroke)
//   elevated → colorSurfaceContainerLow + level-1 shadow
//   filled   → colorSurfaceContainerHighest, no stroke
//   invert   → superfície invertida (escura no tema claro) para card de destaque;
//              texto deve usar tokens *-inverse / white sobre este fundo
const VARIANT_CLASS: Record<CardVariant, string> = {
  outlined: 'border border-stroke-default bg-surface-default',
  elevated: 'border border-transparent bg-surface-default shadow-sm',
  filled:   'border border-transparent bg-surface-raised',
  flat:     'border-0 bg-transparent shadow-none',
  invert:   'border border-transparent bg-surface-invert text-fg-inverse',
};

// M3 Card — corner radius: medium shape = 12dp (rounded-xl)
export function Card({ variant = 'elevated', interactive = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={[
        'rounded-(--radius-card) overflow-hidden',
        VARIANT_CLASS[variant],
        interactive && 'transition-shadow hover:shadow-md cursor-pointer',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  badge?: ReactNode;
  /** Ícone exibido à esquerda do título num container 40×40 bg-surface-raised. */
  icon?: ReactNode;
}

// M3 header: 16dp padding all sides, no bottom divider — spacing separates sections
// `ds-card-header` é marcador estrutural: o CardBody zera o pt quando vem logo após.
export function CardHeader({ title, description, action, badge, icon, className = '', children, ...props }: CardHeaderProps) {
  if (children) {
    return (
      <div className={['ds-card-header flex items-center justify-between gap-4 px-4 py-4', className].join(' ')} {...props}>
        {children}
      </div>
    );
  }
  return (
    <div className={['ds-card-header flex items-start justify-between gap-4 px-4 py-4', className].join(' ')} {...props}>
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {icon && (
          <div className="shrink-0 size-10 rounded-(--radius-card) bg-surface-raised flex items-center justify-center text-fg-secondary">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-label font-semibold text-fg-primary leading-snug">{title}</h3>
            {badge}
          </div>
          {description && <p className="mt-0.5 text-caption text-fg-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={['text-body font-semibold text-fg-primary', className].join(' ')} {...props}>
      {children}
    </h3>
  );
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

// M3 body: 16dp em todos os lados; o pt é zerado quando há CardHeader logo acima
// (o header já provê o espaçamento). Sem header, conteúdo não cola no topo.
export function CardBody({ noPadding, className = '', children, ...props }: CardBodyProps) {
  return (
    <div className={[noPadding ? '' : 'px-4 pb-4 pt-4 [.ds-card-header+&]:pt-0', className].join(' ').trim()} {...props}>
      {children}
    </div>
  );
}

// M3 actions area: 8dp gap from content, 16dp bottom, 16dp sides
export function CardFooter({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['flex items-center justify-end gap-3 px-4 pt-2 pb-4', className].join(' ')} {...props}>
      {children}
    </div>
  );
}
