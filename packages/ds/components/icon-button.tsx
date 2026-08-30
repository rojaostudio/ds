/**
 * IconButton — botão só com ícone, com tooltip integrado e aria-label.
 *
 * Uso:
 *   <IconButton icon={<Trash />} aria-label="Excluir" />
 *   <IconButton icon={<Edit />} aria-label="Editar" variant="filled" />
 *   <IconButton icon={<X />} aria-label="Fechar" size="sm" />
 *   <IconButton icon={<Trash />} aria-label="Excluir" color="danger" />
 *
 * Sempre exige `aria-label` (acessibilidade). Sem label, sem botão.
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type IconButtonVariant = 'filled' | 'outline' | 'ghost';
export type IconButtonColor   = 'primary' | 'secondary' | 'danger' | 'neutral';
export type IconButtonSize    = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon:        ReactNode;
  'aria-label': string;
  variant?:    IconButtonVariant;
  color?:      IconButtonColor;
  size?:       IconButtonSize;
  loading?:    boolean;
}

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: 'size-control-sm [&_svg]:size-4',
  md: 'size-control-md [&_svg]:size-5',
  lg: 'size-control-lg [&_svg]:size-6',
};

// secondary = ação de BAIXA ÊNFASE, neutra por construção (igual ao Button). Não é
// a 2ª cor de marca: --brand-secondary como traço/ícone sobre a surface não tem
// garantia de contraste e SOME (branco/branco, preto/preto). A 2ª cor de marca
// segue viva pra fill explícito. (Decisão da squad — ver button.tsx.)
const COLOR_CLASSES: Record<IconButtonVariant, Record<IconButtonColor, string>> = {
  filled: {
    primary:   'bg-brand-primary text-brand-on-primary hover:bg-brand-hover',
    secondary: 'bg-surface-raised text-fg-primary hover:opacity-90',
    danger:    'bg-danger text-fg-inverse hover:bg-danger-text',
    neutral:   'bg-surface-raised text-fg-primary hover:bg-stroke-default',
  },
  outline: {
    primary:   'border border-brand-primary text-brand-primary hover:bg-surface-raised',
    secondary: 'border border-stroke-default text-fg-secondary hover:bg-surface-raised',
    danger:    'border border-danger text-danger-text hover:bg-danger-soft',
    neutral:   'border border-stroke-default text-fg-secondary hover:bg-surface-raised',
  },
  ghost: {
    primary:   'text-brand-primary hover:bg-surface-raised',
    secondary: 'text-fg-secondary hover:bg-surface-raised',
    danger:    'text-danger-text hover:bg-danger-soft',
    neutral:   'text-fg-muted hover:bg-surface-raised hover:text-fg-primary',
  },
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    icon,
    variant = 'ghost',
    color = 'neutral',
    size = 'md',
    loading = false,
    disabled,
    className = '',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center rounded-(--radius-control) transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus',
        'disabled:cursor-not-allowed disabled:opacity-50',
        SIZE_CLASSES[size],
        COLOR_CLASSES[variant][color],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
    </button>
  );
});

function Spinner() {
  return (
    <svg className="animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
