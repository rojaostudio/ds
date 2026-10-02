import { GoogleAccountChip, GoogleActions, GoogleScreen, type GoogleLayout } from './internal/google';

export interface GoogleConsentProps {
  /** The screen's title (Figma: `title`), such as "Fazer login no <app>". */
  title?: string;
  /** Your app, named in the sharing notice. The Figma has it only inside the title. */
  appName?: string;
  /** m3: the new screen, in two panels; oauth: what Google shows today for sign-in from an app. */
  layout?: GoogleLayout;
  /** The account being shared. */
  email?: string;
  className?: string;
}

/**
 * GoogleConsent — Figma [RDS] External/GoogleConsent. A MOCKUP of Google's consent screen (what Google shares with
 * the app), for flows: nothing in it works. The app's name shows like this only after Google verifies the app.
 * Below 640 of container width it takes the mobile layout (Figma: `screen`). Styles: google-consent.css and
 * internal/google.css.
 */
export function GoogleConsent({ appName = 'Rojão', title, layout = 'm3', email = 'ana@exemplo.com', className }: GoogleConsentProps) {
  return (
    <GoogleScreen
      layout={layout}
      label="Mockup: consentimento do Google"
      title={title ?? `Fazer login no ${appName}`}
      intro={<GoogleAccountChip email={email} />}
      className={['rds-google-consent', className].filter(Boolean).join(' ')}
    >
      <p className="rds-google__text">
        Para criar sua conta, o Google vai compartilhar seu nome, endereço de e-mail e foto do perfil com o {appName}.
        Consulte a Política de Privacidade e os Termos de Serviço do {appName}.
      </p>
      <GoogleActions secondary="Cancelar" primary="Continuar" />
    </GoogleScreen>
  );
}
