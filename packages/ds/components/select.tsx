'use client';

import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { BottomSheet } from './bottom-sheet';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?:       string;
  helper?:      string;
  error?:       string;
  placeholder?: string;
  options?:     { value: string; label: string; disabled?: boolean }[];
  size?:        SelectSize;
  required?:    boolean;
  optional?:    boolean;
}

const SIZE = {
  sm: { h: 'h-control-sm', text: 'text-caption',   padL: 'pl-2.5', padR: 'pr-7'  },
  md: { h: 'h-control-md', text: 'text-label',   padL: 'pl-3',   padR: 'pr-9'  },
  lg: { h: 'h-control-lg', text: 'text-body', padL: 'pl-4',   padR: 'pr-10' },
} as const;

type OptionItem = { value: string; label: string; disabled?: boolean };

// Extrai <option> passados como children para a lista da bottom sheet.
function optionsFromChildren(children: ReactNode): OptionItem[] {
  const out: OptionItem[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean };
    if (child.type === 'option' && props.value !== undefined) {
      out.push({
        value: String(props.value),
        label: typeof props.children === 'string' ? props.children : String(props.children ?? props.value),
        disabled: props.disabled,
      });
    }
  });
  return out;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, helper, error, options = [], placeholder, size = 'md', required, optional, className = '', id, children, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const sz = SIZE[size];

  const innerRef = useRef<HTMLSelectElement | null>(null);
  const setRefs = (el: HTMLSelectElement | null) => {
    innerRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };

  // Mobile (< sm): o dropdown nativo é ruim de usar — o tap abre uma bottom
  // sheet com as opções. Desktop mantém o select nativo.
  const [isXs, setIsXs] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetValue, setSheetValue] = useState('');

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsXs(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const allOptions: OptionItem[] = options.length > 0 ? options : optionsFromChildren(children);

  function openSheet() {
    setSheetValue(innerRef.current?.value ?? '');
    setSheetOpen(true);
  }

  // Seta o valor pelo setter nativo e dispara um change REAL — o onChange do
  // consumidor e o submit do form enxergam a seleção como se fosse do dropdown.
  function commitSheetValue(value: string) {
    const el = innerRef.current;
    setSheetOpen(false);
    if (!el || el.value === value) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="inline-flex items-center gap-1 text-label font-medium text-fg-primary">
          <span>{label}</span>
          {required && <span className="text-danger" aria-label="obrigatório">*</span>}
          {optional && !required && <span className="text-fg-muted font-normal">(opcional)</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={setRefs}
          id={selectId}
          required={required}
          className={[
            'w-full rounded-(--radius-control) appearance-none',
            'bg-surface-default text-fg-primary',
            'border transition-colors outline-none',
            sz.h, sz.text, sz.padL, sz.padR,
            error
              ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
              : 'border-stroke-control focus:border-stroke-focus focus:ring-2 focus:ring-stroke-focus/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          ].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : helper ? `${selectId}-helper` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>{placeholder}</option>
          )}
          {options.map(o => (
            <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
          ))}
          {children}
        </select>
        <ChevronDown
          size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16}
          className={[
            'absolute top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none',
            size === 'sm' ? 'right-2.5' : size === 'lg' ? 'right-3.5' : 'right-3',
          ].join(' ')}
        />
        {/* Overlay que rouba o tap no mobile — o select continua no DOM (valor,
            form, estilo), só não recebe o toque. */}
        {isXs && !props.disabled && allOptions.length > 0 && (
          <button
            type="button"
            aria-label={label ?? placeholder ?? 'Selecionar'}
            aria-haspopup="dialog"
            onClick={openSheet}
            className="absolute inset-0 w-full h-full rounded-(--radius-control) opacity-0"
          />
        )}
      </div>
      {error && <p id={`${selectId}-error`} className="text-caption text-danger-text">{error}</p>}
      {!error && helper && <p id={`${selectId}-helper`} className="text-caption text-fg-muted">{helper}</p>}

      {isXs && (
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={label ?? placeholder}>
          <div className="pb-2">
            {allOptions.map((o) => {
              const selected = o.value === sheetValue;
              return (
                <button
                  key={o.value}
                  type="button"
                  disabled={o.disabled}
                  onClick={() => commitSheetValue(o.value)}
                  className={[
                    'w-full flex items-center justify-between gap-3 px-1 py-3.5 text-left text-label',
                    'border-b border-stroke-subtle last:border-0 transition-colors',
                    selected ? 'font-medium text-fg-primary' : 'text-fg-secondary',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  ].join(' ')}
                >
                  <span className="min-w-0 flex-1">{o.label}</span>
                  {selected && <Check size={16} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        </BottomSheet>
      )}
    </div>
  );
});
