import { Slot } from '@radix-ui/react-slot';
import type { AnchorHTMLAttributes } from 'react';

/** action (default): text/link. neutral: text/body, for a link in running text that should not call attention. */
export type LinkTone = 'action' | 'neutral';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The colour (Figma `tone`). */
  tone?: LinkTone;
  /**
   * Renders the child instead of an <a>, with the link styles: Next's Link, or a <button type="button"> when the
   * action changes the form in the same card instead of going to another page.
   */
  asChild?: boolean;
}

/**
 * Link — a text link inside a sentence: "Ao continuar, você aceita os termos de uso", "Ainda não tem conta? Criar
 * conta grátis". In the Figma it is not a component: it is text formatting (link/* colour, Medium, underline) on a
 * stretch of a text, in any type size; spec in [RDS] Components › Navigation › Link. No padding and no control
 * height: it takes the font of the sentence around it. Always underlined, so colour is never the only cue.
 * Link or Button ghost: a word inside a sentence is a Link; a loose action on its own line or slot ("Esqueci a senha",
 * "Voltar pro login") is a Button variant="ghost", even when it goes to another page. Styles: link.css.
 */
export function Link({ tone = 'action', asChild, className, ...rest }: LinkProps) {
  const Root = asChild ? Slot : 'a';
  return <Root {...rest} className={['rds-link', tone === 'neutral' && 'rds-link--neutral', className].filter(Boolean).join(' ')} />;
}
