'use client';

import { useRef, useState, type ReactNode, type DragEvent } from 'react';

/**
 * Dropzone — área de arrastar-e-soltar / clicar para selecionar arquivos.
 * Substitui `<div className="border-2 border-dashed rounded-xl" onDrop=...>` reimplementado.
 * Gerencia estado de drag, input file escondido e clique. O conteúdo (ícone + texto) é livre.
 */
export interface DropzoneProps {
  onFiles: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function Dropzone({ onFiles, accept, multiple = false, disabled = false, className = '', children }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); inputRef.current?.click(); } }}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={[
        'flex flex-col items-center justify-center gap-3 rounded-(--radius-card) border-2 border-dashed py-10 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        dragging ? 'border-stroke-focus bg-surface-raised' : 'border-stroke-control hover:border-stroke-strong hover:bg-surface-page',
        className,
      ].filter(Boolean).join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ''; }}
      />
      {children}
    </div>
  );
}
