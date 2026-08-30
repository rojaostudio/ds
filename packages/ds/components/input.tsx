'use client';

import { forwardRef, useId, useState, type ReactNode, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  label?:    string;
  helper?:   string;
  error?:    string;
  size?:     InputSize;
  required?: boolean;
  optional?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  prefix?:   ReactNode;
  suffix?:   ReactNode;
  clearable?: boolean;
  onClear?:   () => void;
  /** Em type="password", mostra botão de revelar. default = true. */
  passwordReveal?: boolean;
  /** Conta caracteres (mostra "X/Y" se maxLength definido). */
  showCount?: boolean;
}

const SIZE = {
  sm: { h: 'h-control-sm', text: 'text-caption',   pad: 'px-2.5', icon: 14, padIconL: 'pl-8',  padIconR: 'pr-8',  affix: 'px-2.5' },
  md: { h: 'h-control-md', text: 'text-label',   pad: 'px-3',   icon: 16, padIconL: 'pl-9',  padIconR: 'pr-9',  affix: 'px-3'   },
  lg: { h: 'h-control-lg', text: 'text-body', pad: 'px-4',   icon: 18, padIconL: 'pl-11', padIconR: 'pr-11', affix: 'px-4'   },
} as const;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label, helper, error,
    size = 'md', required, optional,
    iconLeft, iconRight, prefix, suffix,
    clearable, onClear,
    passwordReveal = true, showCount,
    className = '',
    id, type = 'text',
    value, defaultValue, maxLength,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === 'password';
  const effectiveType = isPassword && passwordReveal && revealed ? 'text' : type;

  const hasValue = !!(value ?? defaultValue);
  const showClear  = clearable && hasValue;
  const showReveal = isPassword && passwordReveal;
  const hasRightAdornment = showClear || showReveal || iconRight;

  const sz = SIZE[size];
  const hasAffix = !!(prefix || suffix);

  // Border radius: arredonda só os lados sem affix — token semântico, nunca hardcode
  const inputRadius = hasAffix
    ? prefix && suffix ? 'rounded-none'
      : prefix ? 'rounded-l-none rounded-r-(--radius-control)'
      : 'rounded-l-(--radius-control) rounded-r-none'
    : 'rounded-(--radius-control)';

  const errorClass = error
    ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
    : 'border-stroke-control focus:border-stroke-focus focus:ring-2 focus:ring-stroke-focus/20';

  const inputElement = (
    <div className="relative flex-1 inline-flex items-center">
      {iconLeft && (
        <span
          aria-hidden
          className="absolute left-0 inset-y-0 flex items-center pl-3 text-fg-muted pointer-events-none"
        >
          <span className="[&_svg]:shrink-0" style={{ width: sz.icon, height: sz.icon }}>
            {iconLeft}
          </span>
        </span>
      )}
      <input
        ref={ref}
        id={inputId}
        type={effectiveType}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        required={required}
        className={[
          'w-full bg-surface-default text-fg-primary placeholder:text-fg-placeholder',
          'border transition-colors outline-none',
          inputRadius,
          sz.h, sz.text, sz.pad,
          iconLeft ? sz.padIconL : '',
          hasRightAdornment ? sz.padIconR : '',
          errorClass,
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        ].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
        {...props}
      />
      {hasRightAdornment && (
        <span className="absolute right-0 inset-y-0 flex items-center pr-2 gap-1 pointer-events-none">
          {iconRight && !showClear && !showReveal && (
            <span className="text-fg-muted">{iconRight}</span>
          )}
          {showClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Limpar"
              className="text-fg-muted hover:text-fg-primary p-0.5 rounded transition-colors pointer-events-auto"
            >
              <X size={sz.icon - 2} />
            </button>
          )}
          {showReveal && (
            <button
              type="button"
              onClick={() => setRevealed(r => !r)}
              aria-label={revealed ? 'Ocultar senha' : 'Mostrar senha'}
              className="text-fg-muted hover:text-fg-primary p-1 rounded bg-surface-default transition-colors pointer-events-auto"
            >
              {revealed ? <EyeOff size={sz.icon} /> : <Eye size={sz.icon} />}
            </button>
          )}
        </span>
      )}
    </div>
  );

  const wrappedInput = hasAffix ? (
    <div className="inline-flex w-full items-stretch">
      {prefix && (
        <span className={[
          'inline-flex items-center border border-r-0 border-stroke-control rounded-l-(--radius-control) bg-surface-raised text-fg-muted',
          sz.text, sz.affix,
        ].join(' ')}>
          {prefix}
        </span>
      )}
      {inputElement}
      {suffix && (
        <span className={[
          'inline-flex items-center border border-l-0 border-stroke-control rounded-r-(--radius-control) bg-surface-raised text-fg-muted',
          sz.text, sz.affix,
        ].join(' ')}>
          {suffix}
        </span>
      )}
    </div>
  ) : inputElement;

  const currentLength = typeof value === 'string'
    ? value.length
    : typeof defaultValue === 'string' ? defaultValue.length : 0;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="inline-flex items-center gap-1 text-label font-medium text-fg-primary">
          <span>{label}</span>
          {required && <span className="text-danger" aria-label="obrigatório">*</span>}
          {optional && !required && <span className="text-fg-muted font-normal">(opcional)</span>}
        </label>
      )}
      {wrappedInput}
      {(error || helper || (showCount && maxLength)) && (
        <div className="flex items-start justify-between gap-3">
          {error ? (
            <p id={`${inputId}-error`} className="text-caption text-danger-text flex-1">{error}</p>
          ) : helper ? (
            <p id={`${inputId}-helper`} className="text-caption text-fg-muted flex-1">{helper}</p>
          ) : <span className="flex-1" />}
          {showCount && maxLength && (
            <span className="text-caption text-fg-muted tabular-nums shrink-0">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
});
