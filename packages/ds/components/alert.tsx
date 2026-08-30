import type { ReactNode } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type AlertVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export interface AlertProps {
  variant?:    AlertVariant;
  title?:      ReactNode;
  children?:   ReactNode;
  /** Botão close (X). */
  onClose?:    () => void;
  /** Action button inline (label + onClick). */
  action?:     { label: string; onClick: () => void };
  /** Ícone customizado (substitui o default da variant). */
  icon?:       ReactNode;
  /** Esconde o ícone. default = false. */
  hideIcon?:   boolean;
  className?:  string;
}

const VARIANTS: Record<AlertVariant, { container: string; icon: ReactNode; actionColor: string }> = {
  success: {
    container: 'bg-success-soft border-success-border text-success-text',
    icon: <CheckCircle size={16} className="shrink-0 mt-0.5" />,
    actionColor: 'text-success-text hover:bg-success-soft/60',
  },
  danger: {
    container: 'bg-danger-soft border-danger-border text-danger-text',
    icon: <AlertCircle size={16} className="shrink-0 mt-0.5" />,
    actionColor: 'text-danger-text hover:bg-danger-soft/60',
  },
  warning: {
    container: 'bg-warning-soft border-warning-border text-warning-text',
    icon: <AlertTriangle size={16} className="shrink-0 mt-0.5" />,
    actionColor: 'text-warning-text hover:bg-warning-soft/60',
  },
  info: {
    container: 'bg-info-soft border-info-border text-info-text',
    icon: <Info size={16} className="shrink-0 mt-0.5" />,
    actionColor: 'text-info-text hover:bg-info-soft/60',
  },
  neutral: {
    container: 'bg-neutral-soft border-neutral-border text-neutral-text',
    icon: <Info size={16} className="shrink-0 mt-0.5" />,
    actionColor: 'text-neutral-text hover:bg-neutral-soft/60',
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  action,
  icon,
  hideIcon = false,
  className = '',
}: AlertProps) {
  const { container, icon: defaultIcon, actionColor } = VARIANTS[variant];
  const iconEl = hideIcon ? null : (icon ?? defaultIcon);

  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={['flex items-start gap-3 px-4 py-3 rounded-(--radius-card) border text-label', container, className].join(' ')}
    >
      {iconEl}
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium leading-snug">{title}</p>}
        {children && <div className={['leading-snug', title ? 'mt-0.5 opacity-80' : ''].join(' ')}>{children}</div>}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={['mt-2 inline-flex text-caption font-semibold px-2 py-1 -mx-2 rounded transition-colors', actionColor].join(' ')}
          >
            {action.label}
          </button>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0.5 -m-0.5 rounded"
          aria-label="Fechar"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
