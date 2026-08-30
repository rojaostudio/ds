'use client';

import { forwardRef, useId, useEffect, useRef, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:    string;
  helper?:   string;
  error?:    string;
  required?: boolean;
  optional?: boolean;
  /** Auto-cresce conforme conteúdo (sem scroll bar interna). default = false. */
  autoResize?: boolean;
  /** Conta caracteres (mostra "X/Y" se maxLength definido). */
  showCount?: boolean;
  /** Min rows quando autoResize. default = 3. */
  minRows?:  number;
  /** Max rows quando autoResize (cap pra evitar crescer infinito). default = 10. */
  maxRows?:  number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label, helper, error,
    required, optional,
    autoResize = false,
    showCount,
    minRows = 3,
    maxRows = 10,
    className = '',
    id,
    rows,
    value,
    defaultValue,
    maxLength,
    onChange,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const internalRef = useRef<HTMLTextAreaElement | null>(null);

  // Combina ref externo + interno
  function setRef(el: HTMLTextAreaElement | null) {
    internalRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
  }

  // Auto-resize: ajusta height ao conteúdo
  function adjust() {
    const el = internalRef.current;
    if (!el || !autoResize) return;
    el.style.height = 'auto';
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight || '20');
    const maxH = lineHeight * maxRows + 24; // padding
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
  }

  useEffect(() => { adjust(); }, [value, autoResize]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange?.(e);
    if (autoResize) adjust();
  }

  const currentLength = typeof value === 'string'
    ? value.length
    : typeof defaultValue === 'string' ? defaultValue.length : 0;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={textareaId} className="inline-flex items-center gap-1 text-label font-medium text-fg-primary">
          <span>{label}</span>
          {required && <span className="text-danger" aria-label="obrigatório">*</span>}
          {optional && !required && <span className="text-fg-muted font-normal">(opcional)</span>}
        </label>
      )}
      <textarea
        ref={setRef}
        id={textareaId}
        rows={rows ?? minRows}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        required={required}
        onChange={handleChange}
        className={[
          'w-full px-3 py-2 rounded-(--radius-control) text-label',
          'bg-surface-default text-fg-primary placeholder:text-fg-placeholder',
          'border transition-colors outline-none',
          autoResize ? 'resize-none overflow-hidden' : 'resize-y',
          error
            ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
            : 'border-stroke-control focus:border-stroke-focus focus:ring-2 focus:ring-stroke-focus/20',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:resize-none',
          className,
        ].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${textareaId}-error` : helper ? `${textareaId}-helper` : undefined}
        {...props}
      />
      {(error || helper || (showCount && maxLength)) && (
        <div className="flex items-start justify-between gap-3">
          {error ? (
            <p id={`${textareaId}-error`} className="text-caption text-danger-text flex-1">{error}</p>
          ) : helper ? (
            <p id={`${textareaId}-helper`} className="text-caption text-fg-muted flex-1">{helper}</p>
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
