'use client';

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type PageTab = {
  /** Route mode: a aba navega pra esta URL (default). */
  href?: string;
  /** Controlled mode: identifica a aba quando se usa value/onChange (sem navegar). */
  value?: string;
  label: string;
  /** Show a numeric count badge */
  count?: number;
  /** Show a green "aberto" pill */
  dot?: boolean;
  /** Show an "em breve" label: tab is not yet available */
  soon?: boolean;
  /** Ghost route indicator (dev only) */
  ghost?: boolean;
  /** Match only the exact path (+ matchPaths). Use for root paths like /marketing */
  exact?: boolean;
  /** Extra paths that also activate this tab (prefix match) */
  matchPaths?: string[];
};

function isActive(tab: PageTab, pathname: string): boolean {
  if (!tab.href) return false;
  if (tab.exact) {
    return (
      pathname === tab.href ||
      (tab.matchPaths?.some((p) => pathname.startsWith(p)) ?? false)
    );
  }
  return (
    pathname === tab.href ||
    pathname.startsWith(tab.href + '/') ||
    (tab.matchPaths?.some((p) => pathname.startsWith(p)) ?? false)
  );
}

export interface PageTabsProps {
  tabs: PageTab[];
  trailing?: React.ReactNode;
  /**
   * Controlled mode: quando onChange é passado, as abas viram botões (sem
   * navegação) e o ativo é tab.value === value. Use pra trocar conteúdo na
   * mesma tela (ex: idiomas num form). Sem onChange, segue route-based (Link).
   */
  value?: string;
  onChange?: (value: string) => void;
}

const TAB_BASE =
  'flex items-center gap-2 whitespace-nowrap shrink-0 px-4 sm:px-5 py-4 text-label font-medium border-b-2 transition-colors';

function tabClass(active: boolean): string {
  return [
    TAB_BASE,
    active
      ? '[border-color:var(--page-tabs-indicator-active)] [color:var(--page-tabs-text-active)]'
      : 'border-transparent [color:var(--page-tabs-text)] hover:[color:var(--page-tabs-text-hover)] hover:[border-color:var(--page-tabs-indicator-hover)]',
  ].join(' ');
}

function TabContent({ tab, active }: { tab: PageTab; active: boolean }) {
  return (
    <>
      {tab.ghost && <span title="Rota fantasma em validação">👻</span>}
      {tab.label}
      {tab.soon && (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded [background:var(--page-tabs-soon-bg)] [color:var(--page-tabs-soon-text)]">
          em breve
        </span>
      )}
      {tab.dot && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none [background:var(--page-tabs-dot-bg)] [color:var(--page-tabs-dot-text)]">
          <span className="w-1.5 h-1.5 rounded-full shrink-0 [background:var(--page-tabs-dot-indicator)]" />
          aberto
        </span>
      )}
      {tab.count != null && tab.count > 0 && (
        <span className={[
          'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1',
          'rounded-full text-[11px] font-semibold',
          active
            ? '[background:var(--page-tabs-count-bg-active)] [color:var(--page-tabs-count-text-active)]'
            : '[background:var(--page-tabs-count-bg)] [color:var(--page-tabs-count-text)]',
        ].join(' ')}>
          {tab.count > 99 ? '99+' : tab.count}
        </span>
      )}
    </>
  );
}

export function PageTabs({ tabs, trailing, value, onChange }: PageTabsProps) {
  const pathname = usePathname();
  const controlled = onChange !== undefined;

  return (
    <div className="flex items-center [background:var(--page-tabs-bg)] [border-bottom:1px_solid_var(--page-tabs-border)]">
      <nav className="flex flex-1 overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8" role={controlled ? 'tablist' : undefined}>
        {tabs.map((tab) => {
          const active = controlled ? tab.value === value : isActive(tab, pathname);
          if (controlled) {
            return (
              <button
                key={tab.value ?? tab.label}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange?.(tab.value ?? '')}
                className={tabClass(active)}
              >
                <TabContent tab={tab} active={active} />
              </button>
            );
          }
          return (
            <Link key={tab.href} href={tab.href ?? '#'} className={tabClass(active)}>
              <TabContent tab={tab} active={active} />
            </Link>
          );
        })}
      </nav>
      {trailing && (
        <div className="hidden sm:flex shrink-0 items-center pr-4 sm:pr-6 lg:pr-8">
          {trailing}
        </div>
      )}
    </div>
  );
}
