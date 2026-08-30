'use client';

import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'filled' | 'tonal' | 'outline' | 'ghost' | 'link';
export type ButtonColor   = 'primary' | 'secondary' | 'danger';
export type ButtonSize    = 'sm' | 'md' | 'lg';

const variantColorClasses: Record<ButtonVariant, Record<ButtonColor, string>> = {
  // secondary = ação de BAIXA ÊNFASE, neutra por construção (não a 2ª cor de marca).
  // Usa fg-secondary (4.5:1) + border-default (3:1) + surface-raised, que o motor
  // garante contra a surface em light e dark. Uma cor de marca como traço/texto
  // sobre a surface não tem garantia de contraste → sumia (navy no escuro, branco
  // no claro). A 2ª cor de marca (--brand-secondary) segue viva pra FILL explícito.
  filled: {
    // Borda de AFFORDANCE: transparente por padrão (filled não tem borda visível). O motor só
    // colore --brand-primary-border quando o fill da marca quase encosta na superfície — aí o
    // hairline evita o botão "sumir" no fundo sem tocar na cor escolhida pelo lojista.
    primary:   'bg-brand-primary text-brand-on-primary hover:bg-brand-hover border border-[var(--brand-primary-border,transparent)]',
    secondary: 'bg-surface-raised text-fg-primary hover:opacity-90',
    danger:    'bg-danger text-fg-inverse hover:bg-danger-text',
  },
  tonal: {
    primary:   'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20',
    secondary: 'bg-surface-raised/60 text-fg-secondary hover:bg-surface-raised',
    danger:    'bg-danger-soft text-danger-text hover:bg-danger-soft/70',
  },
  outline: {
    primary:   'ring-1 ring-inset ring-brand-primary bg-transparent text-brand-primary hover:bg-surface-raised',
    secondary: 'ring-1 ring-inset ring-border-default bg-transparent text-fg-secondary hover:bg-surface-raised',
    danger:    'ring-1 ring-inset ring-danger bg-transparent text-danger-text hover:bg-danger-soft',
  },
  ghost: {
    primary:   'bg-transparent text-brand-primary hover:bg-surface-raised',
    secondary: 'bg-transparent text-fg-secondary hover:bg-surface-raised',
    danger:    'bg-transparent text-danger-text hover:bg-danger-soft',
  },
  link: {
    primary:   'bg-transparent text-brand-primary underline-offset-4 hover:underline',
    secondary: 'bg-transparent text-fg-secondary underline-offset-4 hover:underline',
    danger:    'bg-transparent text-danger-text underline-offset-4 hover:underline',
  },
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'box-border h-control-sm px-3 text-caption gap-1.5',
  md: 'box-border h-control-md px-4 text-label gap-2',
  lg: 'box-border h-control-lg px-5 text-body gap-2',
};

const linkSizeClasses: Record<ButtonSize, string> = {
  sm: 'text-caption gap-1',
  md: 'text-label gap-1.5',
  lg: 'text-body gap-2',
};

export function buttonVariants({
  variant   = 'filled',
  color     = 'primary',
  size      = 'md',
  fullWidth = false,
  className = '',
}: {
  variant?:   ButtonVariant;
  color?:     ButtonColor;
  size?:      ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  return [
    'inline-flex items-center justify-center font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    // Radius vem do token semântico — nunca hardcode (governança em base.css)
    variant === 'link' ? linkSizeClasses[size] : `rounded-(--radius-control) ${sizeClasses[size]}`,
    variantColorClasses[variant][color],
    fullWidth && 'w-full',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

const Spinner = () => (
  <svg
    className="animate-spin size-4 shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant;
  color?:     ButtonColor;
  size?:      ButtonSize;
  loading?:   boolean;
  fullWidth?: boolean;
  /** Ícone leading (à esquerda do texto). */
  iconLeft?:  ReactNode;
  /** Ícone trailing (à direita do texto). */
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'filled',
    color = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    iconLeft,
    iconRight,
    disabled,
    className = '',
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonVariants({ variant, color, size, fullWidth, className })}
      {...rest}
    >
      {loading ? <Spinner /> : iconLeft && <span className="shrink-0 [&_svg]:size-4">{iconLeft}</span>}
      {children}
      {iconRight && !loading && <span className="shrink-0 [&_svg]:size-4">{iconRight}</span>}
    </button>
  );
});
