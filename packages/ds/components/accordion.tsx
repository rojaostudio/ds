'use client';

import { forwardRef, useState, useId, useImperativeHandle, useRef, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Accordion — sections colapsáveis empilhadas. Inspirado em shadcn / radix.
 *
 * Uso (single — só um aberto por vez):
 *   <Accordion type="single" defaultValue="a">
 *     <AccordionItem value="a" title="Pergunta 1">...</AccordionItem>
 *     <AccordionItem value="b" title="Pergunta 2">...</AccordionItem>
 *   </Accordion>
 *
 * Uso (multi — vários abertos ao mesmo tempo):
 *   <Accordion type="multi" defaultValue={['a','c']}>
 *     <AccordionItem value="a" title="Seção A">...</AccordionItem>
 *     <AccordionItem value="b" title="Seção B">...</AccordionItem>
 *     <AccordionItem value="c" title="Seção C">...</AccordionItem>
 *   </Accordion>
 */

import { createContext, useContext } from 'react';

interface AccordionContext {
  isOpen:  (value: string) => boolean;
  toggle:  (value: string) => void;
}

const Ctx = createContext<AccordionContext | null>(null);

interface AccordionSingleProps {
  type?:         'single';
  defaultValue?: string;
  value?:        string | null;
  onChange?:     (value: string | null) => void;
  collapsible?:  boolean;  // permite fechar o ativo. default = true
  children:      ReactNode;
  className?:    string;
}

interface AccordionMultiProps {
  type:          'multi';
  defaultValue?: string[];
  value?:        string[];
  onChange?:     (value: string[]) => void;
  children:      ReactNode;
  className?:    string;
}

export type AccordionProps = AccordionSingleProps | AccordionMultiProps;

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(props, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => rootRef.current!);

  const isMulti = props.type === 'multi';
  const [internalSingle, setInternalSingle] = useState<string | null>(
    isMulti ? null : (props.defaultValue ?? null) as string | null,
  );
  const [internalMulti, setInternalMulti] = useState<string[]>(
    isMulti ? (props.defaultValue as string[] ?? []) : [],
  );

  const isControlled = props.value !== undefined;

  const isOpen = (v: string): boolean => {
    if (isMulti) {
      const value = isControlled ? (props.value as string[]) : internalMulti;
      return value.includes(v);
    }
    const value = isControlled ? (props.value as string | null) : internalSingle;
    return value === v;
  };

  const toggle = (v: string) => {
    if (isMulti) {
      const current = isControlled ? (props.value as string[]) : internalMulti;
      const next = current.includes(v) ? current.filter(x => x !== v) : [...current, v];
      if (!isControlled) setInternalMulti(next);
      (props.onChange as (vs: string[]) => void | undefined)?.(next);
    } else {
      const single = props as AccordionSingleProps;
      const current = isControlled ? (props.value as string | null) : internalSingle;
      const collapsible = single.collapsible !== false;
      const next = current === v ? (collapsible ? null : current) : v;
      if (!isControlled) setInternalSingle(next);
      single.onChange?.(next);
    }
  };

  return (
    <Ctx.Provider value={{ isOpen, toggle }}>
      <div ref={rootRef} className={['border-y border-stroke-default divide-y divide-stroke-subtle', props.className].filter(Boolean).join(' ')}>
        {props.children}
      </div>
    </Ctx.Provider>
  );
});

// ── AccordionItem ───────────────────────────────────────────────────────────

export interface AccordionItemProps {
  value:    string;
  title:    ReactNode;
  /** Subtítulo opcional ao lado do título (ex: contagem, tag). */
  meta?:    ReactNode;
  children: ReactNode;
  /** Ícone leading no header. */
  icon?:    ReactNode;
  disabled?: boolean;
}

export function AccordionItem({ value, title, meta, children, icon, disabled = false }: AccordionItemProps) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('AccordionItem must be used inside Accordion');

  const open = ctx.isOpen(value);
  const id = useId();
  const headerId = `${id}-header`;
  const panelId  = `${id}-panel`;

  return (
    <div>
      <h3>
        <button
          type="button"
          id={headerId}
          aria-expanded={open}
          aria-controls={panelId}
          disabled={disabled}
          onClick={() => ctx.toggle(value)}
          className={[
            'w-full flex items-center gap-3 py-3 px-4 min-h-control-md text-left transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-inset',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'hover:bg-surface-raised',
          ].join(' ')}
        >
          {icon && <span className="shrink-0 text-fg-muted [&_svg]:size-4">{icon}</span>}
          <span className="flex-1 font-medium text-fg-primary text-label">{title}</span>
          {meta && <span className="shrink-0 text-caption text-fg-muted">{meta}</span>}
          <ChevronDown
            size={16}
            className={['shrink-0 text-fg-muted transition-transform', open ? 'rotate-180' : ''].join(' ')}
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        className={[
          'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        ].join(' ')}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 text-label text-fg-secondary leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
