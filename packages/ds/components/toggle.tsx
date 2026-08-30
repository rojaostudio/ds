'use client';

import { forwardRef, useId, type ReactNode, type InputHTMLAttributes } from 'react';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?:        ReactNode;
  description?:  ReactNode;
  size?:         'sm' | 'md' | 'lg';
  /** Posição do label em relação ao switch. default = "right". */
  labelPosition?: 'left' | 'right';
}

const SIZE = {
  sm: { track: 'h-4 w-7',  thumb: 'size-3 peer-checked:translate-x-3.5', text: 'text-caption' },
  md: { track: 'h-5 w-9',  thumb: 'size-4 peer-checked:translate-x-4',   text: 'text-label' },
  lg: { track: 'h-6 w-11', thumb: 'size-5 peer-checked:translate-x-5',   text: 'text-label' },
} as const;

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  { label, description, size = 'md', labelPosition = 'right', className = '', id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const sz = SIZE[size];

  const labelEl = (label || description) && (
    <span className="flex flex-col gap-0.5 select-none">
      {label && <span className={[sz.text, 'text-fg-primary leading-snug'].join(' ')}>{label}</span>}
      {description && <span className="text-caption text-fg-muted leading-snug">{description}</span>}
    </span>
  );

  const switchEl = (
    <span className={['relative inline-flex shrink-0 items-center', sz.track].join(' ')}>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        id={inputId}
        className="peer sr-only"
        {...props}
      />
      <span
        className={[
          'absolute inset-0 rounded-full transition-colors',
          'bg-surface-raised border border-stroke-control',
          'peer-checked:bg-(--toggle-track-active) peer-checked:border-transparent',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-stroke-focus/30',
          'peer-disabled:cursor-not-allowed',
        ].join(' ')}
      />
      <span
        className={[
          'relative rounded-full bg-surface-default shadow-sm transition-transform translate-x-0.5',
          sz.thumb,
        ].join(' ')}
      />
    </span>
  );

  return (
    <label
      htmlFor={inputId}
      className={[
        'inline-flex items-start gap-2.5 cursor-pointer',
        'has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed',
        className,
      ].filter(Boolean).join(' ')}
    >
      {labelPosition === 'left' && labelEl}
      <span className="flex items-center pt-0.5">{switchEl}</span>
      {labelPosition === 'right' && labelEl}
    </label>
  );
});
