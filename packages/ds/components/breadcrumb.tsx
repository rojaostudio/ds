/**
 * Breadcrumb — navegação hierárquica.
 *
 * Uso:
 *   <Breadcrumb items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Pedidos', href: '/orders' },
 *     { label: 'Pedido #1234' },                  // sem href = current page
 *   ]} />
 *
 * Truncamento automático em telas pequenas (mostra Home … último).
 */

import { ChevronRight, Home } from 'lucide-react';
import type { ReactNode } from 'react';

export interface BreadcrumbItem {
  label:    string;
  href?:    string;
  /** Ícone leading opcional (ex: Home no primeiro item). */
  icon?:    ReactNode;
}

export interface BreadcrumbProps {
  items:       BreadcrumbItem[];
  /** Separador customizado. default = ChevronRight. */
  separator?:  ReactNode;
  /** Trunca pra mostrar só primeiro + último com `…` no meio quando > este número. */
  maxItems?:   number;
  className?:  string;
  /** Tag de link (default = `<a>`). Pra Next.js, passa `Link` daqui. */
  linkAs?:     React.ComponentType<{ href: string; className?: string; children: ReactNode }>;
}

function DefaultLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return <a href={href} className={className}>{children}</a>;
}

export function Breadcrumb({
  items,
  separator,
  maxItems = 4,
  className = '',
  linkAs: LinkAs = DefaultLink,
}: BreadcrumbProps) {
  const sep = separator ?? <ChevronRight size={14} className="text-fg-muted shrink-0" />;

  // Truncamento: se exceder maxItems, mostra primeiro + ellipsis + 2 últimos
  let displayed: (BreadcrumbItem | { ellipsis: true })[] = items;
  if (items.length > maxItems) {
    displayed = [
      items[0]!,
      { ellipsis: true },
      ...items.slice(items.length - 2),
    ];
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1.5 text-label flex-wrap">
        {displayed.map((entry, idx) => {
          const isLast = idx === displayed.length - 1;
          if ('ellipsis' in entry) {
            return (
              <li key={`ell-${idx}`} className="flex items-center gap-1.5">
                <span className="text-fg-muted px-1" aria-hidden>…</span>
                {!isLast && sep}
              </li>
            );
          }
          const item = entry;
          const labelEl = (
            <span className="inline-flex items-center gap-1">
              {item.icon}
              {item.label}
            </span>
          );
          return (
            <li key={idx} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <LinkAs
                  href={item.href}
                  className="text-fg-muted hover:text-fg-primary transition-colors"
                >
                  {labelEl}
                </LinkAs>
              ) : (
                <span
                  className={isLast ? 'text-fg-primary font-medium' : 'text-fg-muted'}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {labelEl}
                </span>
              )}
              {!isLast && sep}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Helper pra primeiro item sempre ter ícone Home. */
export function homeItem(href = '/'): BreadcrumbItem {
  return { label: 'Início', href, icon: <Home size={14} /> };
}
