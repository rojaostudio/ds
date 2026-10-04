// Shared by Button and IconButton. Not exported from the package.
import { useEffect, type MouseEvent, type MouseEventHandler } from 'react';
import { announce } from './announce';

/**
 * The role (Figma: `tone`): action, neutral or danger. Over the brand colour, apply the theme's brand mode to the
 * band (`.ds-plate`) and use neutral.
 */
export type ButtonTone = 'action' | 'neutral' | 'danger';
/** The emphasis (Figma: `variant`): fill, outline or ghost. */
export type ButtonVariant = 'fill' | 'outline' | 'ghost';
/**
 * The height: sm 36, md 44 (the default), lg 52. The touch target is 44 in every size: on sm, an invisible layer
 * extends it to 44 under a coarse pointer (button.css).
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

export function buttonClassName(tone: ButtonTone, variant: ButtonVariant, size: ButtonSize, extra?: string) {
  return ['rds-button', `rds-button--${tone}`, `rds-button--${variant}`, `rds-button--${size}`, extra]
    .filter(Boolean)
    .join(' ');
}

/**
 * With aria-disabled the element still fires click (implicit form submit on a button, navigation
 * on a link rendered with asChild); cancel it here.
 */
export function blockWhenDisabled<T extends HTMLElement>(disabled: boolean | undefined, onClick?: MouseEventHandler<T>) {
  return (event: MouseEvent<T>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
}

/** Says `label` through the page's live region when loading starts. */
export function useLoadingAnnouncement(loading: boolean | undefined, label: string) {
  useEffect(() => {
    if (loading) announce(label);
  }, [loading, label]);
}

/** The loader: a turning arc, drawn inline so the button needs no icon library. */
export function Loader() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
