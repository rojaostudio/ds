// The parts the Google mockups share (Figma: .google/g, .google/field, .google/account-chip, .google/footer and
// the screen frame of GoogleSignIn, GoogleConsent and GoogleAccountChooser). Not exported. Styles: internal/google.css.
// Mockups: nothing here is a working control; the texts are the ones Google shows (pt-BR), as in the Figma.
import type { ReactNode } from 'react';

export type GoogleLayout = 'm3' | 'oauth';

/**
 * The G of Google, in its four colours (Figma: .google/g). The brand's own mark, drawn only where the Figma draws
 * it (the sign-in button and the Google screens); never recoloured. The fills are the mark's, not the theme's.
 */
export function GoogleG() {
  return (
    <svg className="rds-google-g" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/** The outlined field with the floating label (Figma: .google/field). focus: label on top, 2px primary border. */
export function GoogleField({ label, value, state = 'default' }: { label: string; value?: string; state?: 'default' | 'focus' | 'filled' }) {
  return (
    <div className={`rds-google__field rds-google__field--${state}`}>
      <span className="rds-google__field-label">{label}</span>
      {state === 'filled' && value && <span className="rds-google__field-value">{value}</span>}
    </div>
  );
}

/** The account the screen is about: initial, e-mail and the chevron to switch (Figma: .google/account-chip). */
export function GoogleAccountChip({ email }: { email: string }) {
  return (
    <span className="rds-google__chip">
      <span className="rds-google__avatar rds-google__avatar--sm" aria-hidden="true">
        {email.charAt(0).toUpperCase()}
      </span>
      <span>{email}</span>
      <span className="rds-google__caret" aria-hidden="true" />
    </span>
  );
}

/** The primary button and the text action on its left (Figma: actions). */
export function GoogleActions({ secondary, primary }: { secondary: string; primary: string }) {
  return (
    <div className="rds-google__actions">
      <span className="rds-google__link">{secondary}</span>
      <span className="rds-google__primary">{primary}</span>
    </div>
  );
}

export interface GoogleScreenProps {
  layout: GoogleLayout;
  /** What the mockup shows, for screen readers. */
  label: string;
  title: ReactNode;
  /** Under the title: the "Prosseguir para <app>" line or the account chip. */
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * The Google screen: the page, the card and the footer. m3: a card in two panels (the G, the title and the intro on
 * the left; the form on the right), stacked below 640 of container width. oauth: the narrow card with the "Fazer
 * Login com o Google" header and everything centred, edge to edge below 640.
 */
export function GoogleScreen({ layout, label, title, intro, children, className }: GoogleScreenProps) {
  return (
    <div role="group" aria-label={label} className={['rds-google', `rds-google--${layout}`, className].filter(Boolean).join(' ')}>
      <div className="rds-google__page">
        <div className="rds-google__card">
          {layout === 'oauth' && (
            <div className="rds-google__header">
              <GoogleG />
              <span>Fazer Login com o Google</span>
            </div>
          )}
          <div className="rds-google__body">
            <div className="rds-google__intro">
              {layout === 'm3' && <GoogleG />}
              <p className="rds-google__title">{title}</p>
              {intro}
            </div>
            <div className="rds-google__form">{children}</div>
          </div>
        </div>
        <div className="rds-google__footer">
          <span className="rds-google__language">
            Português (Brasil)
            <span className="rds-google__caret" aria-hidden="true" />
          </span>
          <span className="rds-google__footer-links">
            <span>Ajuda</span>
            <span>Privacidade</span>
            <span>Termos</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** "Prosseguir para <app>" (or another lead) with the app's name in the primary colour. */
export function GoogleAppLine({ lead, appName }: { lead: string; appName: string }) {
  return (
    <p className="rds-google__subtitle">
      {lead} <span className="rds-google__app">{appName}</span>
    </p>
  );
}
