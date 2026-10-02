import type { ButtonHTMLAttributes } from 'react';
import { GoogleG } from './internal/google';

export type GoogleButtonTheme = 'light' | 'dark' | 'neutral';
export type GoogleButtonShape = 'rectangular' | 'pill';
export type GoogleButtonType = 'standard' | 'icon';

export interface GoogleButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'> {
  /**
   * The text (Figma: `label`). Only the texts Google allows in pt-BR: "Fazer login com o Google", "Continuar com o
   * Google", "Inscrever-se com o Google". With `type="icon"` it is the accessible name.
   */
  children?: string;
  /** light: white with a grey border; dark: near black; neutral: light grey, no border. */
  theme?: GoogleButtonTheme;
  shape?: GoogleButtonShape;
  /** standard: the G and the text; icon: only the G, 40 × 40 (Figma: `type`; the HTML type is always "button"). */
  type?: GoogleButtonType;
}

/**
 * GoogleButton — Figma [RDS] External/GoogleButton. A MOCKUP of the official "Fazer login com o Google" button,
 * with the measures and colours of Google's branding package: 40 tall, the G (20) 12 from the edge, 10 to the text,
 * 14/20 medium. A real <button>: wire the click to your sign-in. Styles: google-button.css.
 */
export function GoogleButton({
  children = 'Fazer login com o Google',
  theme = 'light',
  shape = 'rectangular',
  type = 'standard',
  className,
  ...rest
}: GoogleButtonProps) {
  return (
    <button
      type="button"
      aria-label={type === 'icon' ? children : undefined}
      {...rest}
      className={['rds-google-button', `rds-google-button--${theme}`, `rds-google-button--${shape}`, `rds-google-button--${type}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      <GoogleG />
      {type === 'standard' && <span className="rds-google-button__label">{children}</span>}
    </button>
  );
}
