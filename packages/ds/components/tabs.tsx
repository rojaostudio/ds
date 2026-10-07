'use client';

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

export interface TabsProps {
  /** The TabsList and a TabsContent per tab. */
  children: ReactNode;
  /** The open tab (controlled). With links (asChild), the value of the current route. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * automatic (default): the arrows open the tab they land on. manual: the arrows only move the focus, Enter or
   * Space opens. Use manual when the tabs are links (asChild), so the arrows do not change the selection without
   * navigating.
   */
  activationMode?: 'automatic' | 'manual';
  className?: string;
}

/**
 * Tabs — Figma [RDS] Navigation/Tabs. Views of the same place, one at a time (Radix Tabs): role="tablist",
 * the arrows, Home and End move between tabs, aria-selected marks the open one. Styles: tabs.css.
 */
export function Tabs({ className, activationMode = 'automatic', ...props }: TabsProps) {
  return (
    <TabsPrimitive.Root
      {...props}
      activationMode={activationMode}
      className={['rds-tabs', className].filter(Boolean).join(' ')}
    />
  );
}

export interface TabsListProps {
  /** What the tabs switch ("Pedidos"). The tablist's accessible name. */
  'aria-label': string;
  /** The TabsTriggers, in the order of use (Figma: the `tabs` slot). */
  children: ReactNode;
  /** A page action at the right end of the strip, outside the tablist: a small Button, a filter (Figma: `trailing`). */
  trailing?: ReactNode;
  className?: string;
}

/** The strip of tabs over the baseline (Figma: the `tabs` slot), with the `trailing` slot on the right. */
export function TabsList({ children, trailing, className, ...rest }: TabsListProps) {
  return (
    <div className={['rds-tabs__bar', className].filter(Boolean).join(' ')}>
      <TabsPrimitive.List {...rest} className="rds-tabs__list">
        {children}
      </TabsPrimitive.List>
      {trailing && <div className="rds-tabs__trailing">{trailing}</div>}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  /**
   * The tab's name (Figma: `label`). With `asChild`, a single link element (an `<a>`, a framework `Link`) whose
   * text is the name: the tab is then that link.
   */
  children: ReactNode;
  /** An icon before the name, in the name's colour (Figma: `showIcon` + `icon`), for tabs that switch views. Decorative. */
  icon?: ReactNode;
  /** A count after the name, when the number helps choosing (Figma: `showCount` + `count`). */
  count?: number | string;
  /** The "em breve" tag: the view is not there yet (Figma: `showSoon`). Usually with `disabled`. */
  soon?: boolean;
  /** The status dot: there is something new in this view (Figma: `showDot`). */
  dot?: boolean;
  /** What the dot means, read by screen readers (the dot alone is only colour). */
  dotLabel?: string;
  disabled?: boolean;
  /**
   * Render the single child element (an `<a>`, a framework `Link`) as the tab instead of a `<button>`: the way
   * to make tabs that navigate. Control `value` from the current route.
   */
  asChild?: boolean;
}

/** One tab (Figma: .tabs/tab). Order inside: icon, name, "em breve", dot, count. */
export function TabsTrigger({ value, children, icon, count, soon, dot, dotLabel = 'Tem novidade', disabled, asChild }: TabsTriggerProps) {
  const lead = icon && (
    <span className="rds-tabs__icon" aria-hidden="true">
      {icon}
    </span>
  );
  const extras = (
    <>
      {soon && <span className="rds-tabs__soon">em breve</span>}
      {dot && (
        <span className="rds-tabs__dot">
          <span className="rds-visually-hidden">{dotLabel}</span>
        </span>
      )}
      {count !== undefined && <span className="rds-tabs__count">{count}</span>}
    </>
  );
  if (asChild && isValidElement(children)) {
    const link = children as ReactElement<{ className?: string; children?: ReactNode }>;
    return (
      <TabsPrimitive.Trigger value={value} disabled={disabled} asChild>
        {cloneElement(link, {
          className: ['rds-tabs__tab', link.props.className].filter(Boolean).join(' '),
          children: (
            <>
              {lead}
              <span className="rds-tabs__label">{link.props.children}</span>
              {extras}
            </>
          ),
        })}
      </TabsPrimitive.Trigger>
    );
  }
  return (
    <TabsPrimitive.Trigger value={value} disabled={disabled} className="rds-tabs__tab">
      {lead}
      <span className="rds-tabs__label">{children}</span>
      {extras}
    </TabsPrimitive.Trigger>
  );
}

export interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

/** The view of one tab: role="tabpanel", named by its tab. */
export function TabsContent({ value, children, className }: TabsContentProps) {
  return (
    <TabsPrimitive.Content value={value} className={['rds-tabs__panel', className].filter(Boolean).join(' ')}>
      {children}
    </TabsPrimitive.Content>
  );
}
