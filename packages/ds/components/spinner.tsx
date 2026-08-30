export type SpinnerSize  = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'current' | 'brand' | 'muted' | 'inverse';

export interface SpinnerProps {
  size?:      SpinnerSize;
  color?:     SpinnerColor;
  /** Texto pra leitor de tela. default = "Carregando…". */
  label?:     string;
  className?: string;
}

const SIZE: Record<SpinnerSize, string> = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
  xl: 'size-8',
};

const COLOR: Record<SpinnerColor, string> = {
  current: 'text-current',
  brand:   'text-brand-primary',
  muted:   'text-fg-muted',
  inverse: 'text-fg-inverse',
};

export function Spinner({
  size = 'md',
  color = 'current',
  label = 'Carregando…',
  className = '',
}: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <svg
        className={['animate-spin', SIZE[size], COLOR[color], className].join(' ')}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
