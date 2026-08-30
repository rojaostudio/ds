const SKELETON_VARIANTS = {
  text:   'h-4 w-full',
  title:  'h-6 w-3/5',
  avatar: 'size-10 rounded-full',
  circle: 'size-12 rounded-full',
  button: 'h-10 w-24 rounded-(--radius-card)',
  card:   'h-32 w-full rounded-(--radius-card)',
  line:   'h-3 w-full',
} as const;

export type SkeletonVariant = keyof typeof SKELETON_VARIANTS;

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:  SkeletonVariant;
  /** Renderiza N skeletons stackados (útil pra simular lista). */
  count?:    number;
  /** Gap entre skeletons quando count > 1. default = 'sm'. */
  gap?:      'sm' | 'md' | 'lg';
  /** Sem animação pulse (placeholder estático). */
  noPulse?:  boolean;
}

const GAP = { sm: 'gap-2', md: 'gap-3', lg: 'gap-4' } as const;

export function Skeleton({
  variant = 'text',
  count = 1,
  gap = 'sm',
  noPulse = false,
  className = '',
  ...props
}: SkeletonProps) {
  const classes = [
    noPulse ? '' : 'animate-pulse',
    'rounded bg-stroke-default/50',
    SKELETON_VARIANTS[variant],
    className,
  ].filter(Boolean).join(' ');

  if (count === 1) return <div className={classes} {...props} />;

  return (
    <div className={['flex flex-col', GAP[gap]].join(' ')}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={classes}
          {...(i === 0 ? props : {})}
          // Última linha de "text" fica menor pra parecer texto real
          style={variant === 'text' && i === count - 1 ? { width: '70%' } : undefined}
        />
      ))}
    </div>
  );
}
