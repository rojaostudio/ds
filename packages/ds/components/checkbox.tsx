'use client';

import { forwardRef, useEffect, useId, useRef, type ReactNode, type InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?:         ReactNode;
  /** Texto secundário abaixo do label. */
  description?:   ReactNode;
  indeterminate?: boolean;
  error?:         string;
  size?:          'sm' | 'md';
}

const SIZE_CLASS = {
  sm: { box: 'size-3.5', svg: 'size-3.5', label: 'text-caption', icon: 12 },
  md: { box: 'size-4',   svg: 'size-4',   label: 'text-label', icon: 14 },
} as const;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, indeterminate = false, error, size = 'md', className = '', id, ...props },
  ref,
) {
  const innerRef = useRef<HTMLInputElement>(null);

  const setRef = (node: HTMLInputElement | null) => {
    (innerRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
  };

  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

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
            ref={setRef}
            type="checkbox"
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errId : undefined}
            className={[
              'peer appearance-none rounded shrink-0 cursor-pointer',
              sz.box,
              'bg-surface-default',
              error
                ? 'border border-danger checked:bg-danger checked:border-danger indeterminate:bg-danger indeterminate:border-danger'
                : 'border border-stroke-control checked:bg-brand-primary checked:border-brand-primary indeterminate:bg-brand-primary indeterminate:border-brand-primary',
              'focus-visible:ring-2 focus-visible:ring-stroke-focus/30 focus-visible:outline-none',
              'disabled:cursor-not-allowed',
              'transition-colors',
            ].join(' ')}
            {...props}
          />
          <svg
            className={['absolute inset-0 pointer-events-none hidden peer-checked:block text-brand-on-primary', sz.svg].join(' ')}
            viewBox="0 0 16 16" fill="none" aria-hidden="true"
          >
            <path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg
            className={['absolute inset-0 pointer-events-none hidden peer-indeterminate:block text-brand-on-primary', sz.svg].join(' ')}
            viewBox="0 0 16 16" fill="none" aria-hidden="true"
          >
            <path d="M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
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
