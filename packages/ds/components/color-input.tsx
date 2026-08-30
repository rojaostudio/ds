'use client';

import { useEffect, useRef, useState } from 'react';

export interface ColorInputProps {
  /** Hex #RRGGBB. */
  value: string;
  /** Dispara apenas com hex válido, normalizado em UPPERCASE. */
  onChange: (hex: string) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * ColorInput — campo de cor único: swatch (abre o picker nativo) + hex
 * editável, no mesmo controle. Molécula sobre os tokens do Input: mesma
 * altura, borda, radius e anel de foco.
 */
export function ColorInput({
  value,
  onChange,
  size = 'md',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}: ColorInputProps) {
  const [draft, setDraft] = useState(value.toUpperCase());
  const inputRef = useRef<HTMLInputElement>(null);

  // Valor externo mudou (picker, reset) → sincroniza o texto.
  useEffect(() => { setDraft(value.toUpperCase()); }, [value]);

  function commit() {
    const raw = draft.trim();
    const hex = raw.startsWith('#') ? raw : `#${raw}`;
    if (HEX_RE.test(hex)) {
      onChange(hex.toUpperCase());
      setDraft(hex.toUpperCase());
    } else {
      setDraft(value.toUpperCase()); // inválido reverte
    }
  }

  const h = size === 'sm' ? 'h-control-sm' : 'h-control-md';
  const swatch = size === 'sm' ? 'size-5' : 'size-6';

  return (
    <div
      className={[
        'inline-flex items-center gap-2 px-2.5 w-36',
        h,
        'rounded-(--radius-control) border border-stroke-control bg-surface-default',
        'transition-colors focus-within:border-stroke-focus focus-within:ring-2 focus-within:ring-stroke-focus/20',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Swatch: o input color nativo fica invisível por cima — picker e teclado de graça */}
      <span className={`relative shrink-0 ${swatch} rounded-(--radius-control) border border-stroke-subtle overflow-hidden`}>
        <span className="absolute inset-0" style={{ backgroundColor: value }} />
        <input
          type="color"
          value={HEX_RE.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          disabled={disabled}
          aria-label={ariaLabel}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
        />
      </span>
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); inputRef.current?.blur(); } }}
        disabled={disabled}
        maxLength={7}
        aria-label={ariaLabel}
        className="min-w-0 flex-1 bg-transparent text-label font-mono text-fg-primary outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}
