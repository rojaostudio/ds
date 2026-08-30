'use client';

import { forwardRef, useId, type ReactNode, type InputHTMLAttributes } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?:       ReactNode;
  description?: ReactNode;
  error?:       string;
  size?:        'sm' | 'md';
}

const SIZE_CLASS = {
  sm: { box: 'size-3.5', dot: 'size-1.5', label: 'text-caption' },
  md: { box: 'size-4',   dot: 'size-2',   label: 'text-label' },
} as const;

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, description, error, size = 'md', className = '', id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errId = `${inputId}-error`;
  const sz = SIZE_CLASS[size];

  return (
    <div className="inline-flex flex-col gap-0.5">
      <label
        htmlFor={inputId}
        className={[
          'inline-flex items-start gap-2 cursor-pointer',
          'has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed',
          className,
        ].filter(Boolean).join(' ')}
      >
        <span className={['relative flex shrink-0 mt-0.5', sz.box].join(' ')}>
          <input
            ref={ref}
            type="radio"
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errId : undefined}
            className={[
              'peer appearance-none rounded-full shrink-0 cursor-pointer',
              sz.box,
              'bg-surface-default',
              error
                ? 'border border-danger checked:border-danger'
                : 'border border-stroke-control checked:border-brand-primary',
              'focus-visible:ring-2 focus-visible:ring-stroke-focus/30 focus-visible:outline-none',
              'disabled:cursor-not-allowed transition-colors',
            ].join(' ')}
            {...props}
          />
          <span
            aria-hidden
            className={[
              'absolute inset-0 m-auto rounded-full bg-transparent transition-colors pointer-events-none',
              sz.dot,
              error ? 'peer-checked:bg-danger' : 'peer-checked:bg-brand-primary',
            ].join(' ')}
          />
        </span>
        {(label || description) && (
          <span className="flex flex-col gap-0.5 select-none">
            {label && <span className={[sz.label, 'text-fg-primary leading-snug'].join(' ')}>{label}</span>}
            {description && <span className="text-caption text-fg-muted leading-snug">{description}</span>}
          </span>
        )}
      </label>
      {error && <p id={errId} className={[sz.box === 'size-3.5' ? 'pl-5' : 'pl-6', 'text-caption text-danger-text'].join(' ')}>{error}</p>}
    </div>
  );
});

// ── RadioGroup ──────────────────────────────────────────────────────────────

export interface RadioOption<T extends string = string> {
  value:        T;
  label:        ReactNode;
  description?: ReactNode;
  disabled?:    boolean;
}

export interface RadioGroupProps<T extends string = string> {
  name:         string;
  value:        T | null;
  onChange:     (value: T) => void;
  options:      RadioOption<T>[];
  /** Layout. default = vertical. */
  orientation?: 'horizontal' | 'vertical';
  size?:        'sm' | 'md';
  error?:       string;
  /** Label do group como `<legend>`. */
  legend?:      ReactNode;
  required?:    boolean;
  className?:   string;
}

export function RadioGroup<T extends string = string>({
  name,
  value,
  onChange,
  options,
  orientation = 'vertical',
  size = 'md',
  error,
  legend,
  required,
  className = '',
}: RadioGroupProps<T>) {
  return (
    <fieldset
      className={['flex flex-col gap-2', className].join(' ')}
      aria-invalid={error ? true : undefined}
    >
      {legend && (
        <legend className="text-label font-medium text-fg-primary mb-0.5">
          {legend}
          {required && <span className="text-danger ml-0.5" aria-label="obrigatório">*</span>}
        </legend>
      )}
      <div className={['flex', orientation === 'horizontal' ? 'flex-row gap-4 flex-wrap' : 'flex-col gap-2'].join(' ')}>
        {options.map(opt => (
          <Radio
            key={opt.value}
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            label={opt.label}
            description={opt.description}
            disabled={opt.disabled}
            size={size}
          />
        ))}
      </div>
      {error && <p className="text-caption text-danger-text">{error}</p>}
    </fieldset>
  );
}
