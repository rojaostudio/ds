'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ChipItem {
  id: string;
  label: string;
}

export interface ChipInputProps {
  value: ChipItem[];
  onChange: (next: ChipItem[]) => void;
  /** Available suggestions — filtered by current input text. */
  suggestions?: ChipItem[];
  placeholder?: string;
  /** Helper text shown below the input. */
  helper?: ReactNode;
  /** When defined, free-form text confirms create the chip via this callback. */
  onCreate?: (text: string) => Promise<ChipItem | null> | ChipItem | null;
  /** Dropdown copy for the "create" option. */
  createPrefix?: string;
  creatingLabel?: string;
  /** Custom aria-label for the chip remove button. */
  removeAriaLabel?: (chip: ChipItem) => string;
}

export function ChipInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  helper,
  onCreate,
  createPrefix = 'Criar',
  creatingLabel = 'Criando...',
  removeAriaLabel,
}: ChipInputProps) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Dropdown portalado (position:fixed) pra não ser cortado/encoberto por cards
  // irmãos — escapa de qualquer overflow/stacking do container consumidor.
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  // Acompanha a posição do input enquanto o dropdown está aberto (abertura, scroll, resize).
  useEffect(() => {
    if (!open) return;
    function update() {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  const trimmed = input.trim();
  const filtered = suggestions.filter(
    (s) => !value.some((v) => v.id === s.id) && s.label.toLowerCase().includes(trimmed.toLowerCase()),
  );
  const exactMatch = suggestions.some((s) => s.label.toLowerCase() === trimmed.toLowerCase());
  const showCreate = !!onCreate && trimmed.length > 0 && !exactMatch;

  function selectChip(chip: ChipItem) {
    if (value.some((v) => v.id === chip.id)) return;
    onChange([...value, chip]);
    setInput('');
    setOpen(false);
  }

  function removeChip(id: string) {
    onChange(value.filter((v) => v.id !== id));
  }

  async function handleCreate() {
    if (!onCreate || !trimmed || creating) return;
    setCreating(true);
    try {
      const result = await onCreate(trimmed);
      if (result) {
        onChange([...value, result]);
        setInput('');
        setOpen(false);
      }
    } finally {
      setCreating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (filtered.length > 0) { selectChip(filtered[0]); return; }
      if (showCreate) void handleCreate();
      return;
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeChip(value[value.length - 1].id);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap gap-1.5 px-2.5 py-2 min-h-[38px] border border-stroke-control rounded-(--radius-control) bg-surface-default focus-within:border-stroke-strong cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((chip) => (
          <span
            key={chip.id}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-(--brand-primary) text-(--text-inverse) text-caption font-medium"
          >
            {chip.label}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeChip(chip.id); }}
              className="ml-0.5 leading-none hover:opacity-70 transition-opacity"
              aria-label={removeAriaLabel?.(chip) ?? `Remove ${chip.label}`}
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-label text-(--text-secondary) placeholder:text-(--text-disabled) focus:outline-none"
        />
      </div>

      {open && pos && (filtered.length > 0 || showCreate) && createPortal(
        <ul
          ref={listRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
          className="z-50 bg-surface-default border border-stroke-control rounded-(--radius-control) shadow-md max-h-48 overflow-auto"
        >
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); selectChip(s); }}
                className="w-full text-left px-3 py-2 text-label text-(--text-secondary) hover:bg-(--surface-page) transition-colors"
              >
                {s.label}
              </button>
            </li>
          ))}
          {showCreate && (
            <li className={filtered.length > 0 ? 'border-t border-stroke-subtle' : ''}>
              <button
                type="button"
                disabled={creating}
                onMouseDown={(e) => { e.preventDefault(); void handleCreate(); }}
                className="w-full text-left px-3 py-2 text-label font-medium text-(--text-primary) hover:bg-(--surface-page) transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <span className="text-(--text-disabled)">+</span>
                {creating ? creatingLabel : <>{createPrefix} <span className="font-semibold">{`"${trimmed}"`}</span></>}
              </button>
            </li>
          )}
        </ul>,
        document.body,
      )}

      {helper && <p className="mt-1 text-caption text-(--text-disabled)">{helper}</p>}
    </div>
  );
}
