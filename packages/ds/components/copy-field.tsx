'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export interface CopyFieldProps {
  /** Texto copiado pro clipboard. */
  value: string;
  /** Rótulo do botão em repouso. */
  label?: string;
  /** Rótulo após copiar (feedback). */
  copiedLabel?: string;
  /** Largura total do container. */
  fullWidth?: boolean;
  className?: string;
}

// Botão de copiar-pro-clipboard com feedback de estado. Reúne num só lugar a lógica
// de clipboard + "copiado!" que costuma ser reinventada inline (QR Pix, compartilhar loja).
export function CopyField({
  value,
  label = 'Copiar',
  copiedLabel = 'Copiado!',
  fullWidth = false,
  className = '',
}: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível (contexto sem permissão) — falha silenciosa
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className={[
        'inline-flex items-center justify-center gap-2 h-control-md px-4 rounded-(--radius-card)',
        'border border-stroke-default text-fg-secondary text-sm font-semibold',
        'hover:bg-surface-hover transition-colors focus-visible:ring-2 focus-visible:ring-stroke-focus',
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
    >
      {copied
        ? <Check className="size-4 shrink-0 text-success-text" />
        : <Copy className="size-4 shrink-0" />}
      {copied ? copiedLabel : label}
    </button>
  );
}
