import { cloneElement, isValidElement, type ReactNode, type ReactElement, type HTMLAttributes } from 'react';

/**
 * className for a brand theme: `theme-<name>` (+ ` dark`). The DS theme CSS is
 * class-scoped, so apply this wherever you want the theme to take effect — on
 * `<html>`/`<body>` for the whole app, or via <Themed> for a subtree.
 *
 *   <html className={themeClass('padaria', isDark)}>
 */
export const themeClass = (theme: string, dark = false): string =>
  `theme-${theme}${dark ? ' dark' : ''}`;

export interface ThemedProps extends HTMLAttributes<HTMLDivElement> {
  /** Brand theme name → `.theme-<name>` (the served sheet's selector). */
  theme: string;
  /** Apply dark mode (`.dark`). */
  dark?: boolean;
  /** Merge the theme class onto the single child element instead of wrapping a
   *  `<div>` (no extra DOM node — apply the theme to a `<main>`, `<section>`…). */
  asChild?: boolean;
  children: ReactNode;
}

/**
 * Scopes a brand theme to its subtree via the `.theme-<name>` class. Because the
 * theme CSS is class-scoped (not :root), this can NEST — different subtrees can
 * render different themes on the same page. For the whole app, prefer putting
 * `themeClass()` on `<html>` instead of wrapping everything in a div.
 *
 *   <Themed theme="padaria">…</Themed>
 *   <Themed theme="pet" dark>…</Themed>
 *   <Themed theme="cafe" asChild><main>…</main></Themed>
 *
 * Pair with your theme sheet + base.css.
 */
export function Themed({ theme, dark = false, asChild = false, className, children, ...rest }: ThemedProps) {
  const cls = themeClass(theme, dark);

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      ...rest,
      className: [cls, child.props.className, className].filter(Boolean).join(' '),
    });
  }

  return (
    <div className={[cls, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}
