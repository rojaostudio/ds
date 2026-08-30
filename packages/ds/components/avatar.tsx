/**
 * Avatar — representação visual de usuário/entidade.
 *
 * Uso:
 *   <Avatar src="/u.jpg" alt="Marcos" />
 *   <Avatar name="Marcos Silva" />          // gera iniciais
 *   <Avatar name="A" size="lg" />
 *   <Avatar name="J" status="active" />     // dot indicador
 *
 * AvatarGroup — empilha avatares com overlap.
 *   <AvatarGroup max={3}>
 *     <Avatar name="A" />
 *     <Avatar name="B" />
 *     ...
 *   </AvatarGroup>
 */

import { Children, isValidElement, cloneElement, type ReactElement } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'active' | 'inactive' | 'pending' | 'error';

export interface AvatarProps {
  src?:    string;
  alt?:    string;
  /** Nome completo — gera iniciais (até 2 letras). */
  name?:   string;
  size?:   AvatarSize;
  status?: AvatarStatus;
  /** Cor de fundo. default = brand-primary. */
  variant?: 'brand' | 'neutral';
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-caption',
  md: 'size-10 text-label',
  lg: 'size-12 text-body',
  xl: 'size-16 text-heading-sm',
};

const STATUS_DOT_SIZE: Record<AvatarSize, string> = {
  xs: 'size-1.5',
  sm: 'size-2',
  md: 'size-2.5',
  lg: 'size-3',
  xl: 'size-3.5',
};

const STATUS_COLOR: Record<AvatarStatus, string> = {
  active:   'bg-success',
  inactive: 'bg-state-disabled-text',
  pending:  'bg-warning',
  error:    'bg-danger',
};

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  // Nome de uma palavra só: usa as duas primeiras letras — avatar sempre com 2 chars
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  status,
  variant = 'brand',
  className = '',
}: AvatarProps) {
  const showImage = !!src;
  const label = alt ?? name ?? 'Avatar';
  const bgClass = variant === 'brand'
    ? 'bg-brand-primary text-brand-on-primary'
    : 'bg-surface-raised text-fg-secondary';

  return (
    <div className={['relative inline-flex shrink-0', className].join(' ')}>
      <div
        className={[
          'inline-flex items-center justify-center rounded-full overflow-hidden font-semibold select-none',
          SIZE_CLASSES[size],
          showImage ? '' : bgClass,
        ].join(' ')}
        aria-label={label}
        role="img"
      >
        {showImage ? (
          <img src={src} alt={label} className="size-full object-cover" />
        ) : (
          <span>{initials(name ?? '?')}</span>
        )}
      </div>
      {status && (
        <span
          className={[
            'absolute bottom-0 right-0 rounded-full ring-2 ring-surface-default',
            STATUS_DOT_SIZE[size],
            STATUS_COLOR[status],
          ].join(' ')}
          aria-label={`status: ${status}`}
        />
      )}
    </div>
  );
}

// ── AvatarGroup ─────────────────────────────────────────────────────────────

export interface AvatarGroupProps {
  /** Máximo de avatares visíveis; o resto vira `+N`. default = 3. */
  max?:      number;
  /** Sobreposição em px. default depende do size. */
  spacing?:  'tight' | 'normal' | 'loose';
  size?:     AvatarSize;
  children:  React.ReactNode;
  className?: string;
}

const SPACING_CLASS: Record<NonNullable<AvatarGroupProps['spacing']>, string> = {
  tight:  '-ml-3',
  normal: '-ml-2',
  loose:  '-ml-1',
};

export function AvatarGroup({
  max = 3,
  spacing = 'normal',
  size = 'md',
  children,
  className = '',
}: AvatarGroupProps) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarProps>[];
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;

  return (
    <div className={['inline-flex items-center', className].join(' ')} role="group">
      {visible.map((child, idx) => (
        <div key={idx} className={idx === 0 ? '' : SPACING_CLASS[spacing]}>
          {cloneElement(child, { size: child.props.size ?? size })}
        </div>
      ))}
      {overflow > 0 && (
        <div className={SPACING_CLASS[spacing]}>
          <Avatar
            name={`+${overflow}`}
            variant="neutral"
            size={size}
          />
        </div>
      )}
    </div>
  );
}
