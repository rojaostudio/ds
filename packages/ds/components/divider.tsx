/**
 * Divider — separador visual horizontal ou vertical.
 *
 * Uso:
 *   <Divider />                              // horizontal subtle
 *   <Divider orientation="vertical" />       // vertical
 *   <Divider variant="strong" />             // mais visível
 *   <Divider><span>OU</span></Divider>       // com label centralizado
 */

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?:     'subtle' | 'default' | 'strong';
  className?:   string;
  children?:    React.ReactNode;
}

const COLOR_BY_VARIANT = {
  subtle:  'bg-stroke-subtle',
  default: 'bg-stroke-default',
  strong:  'bg-stroke-strong',
} as const;

export function Divider({
  orientation = 'horizontal',
  variant = 'default',
  className = '',
  children,
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={['shrink-0 self-stretch w-px', COLOR_BY_VARIANT[variant], className].join(' ')}
      />
    );
  }

  // Horizontal com label opcional no centro
  if (children) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={['flex items-center gap-3 my-2', className].join(' ')}
      >
        <span className={['flex-1 h-px', COLOR_BY_VARIANT[variant]].join(' ')} />
        <span className="text-caption text-fg-muted shrink-0">{children}</span>
        <span className={['flex-1 h-px', COLOR_BY_VARIANT[variant]].join(' ')} />
      </div>
    );
  }

  return (
    <hr
      role="separator"
      aria-orientation="horizontal"
      className={['border-0 h-px my-2', COLOR_BY_VARIANT[variant], className].join(' ')}
    />
  );
}
