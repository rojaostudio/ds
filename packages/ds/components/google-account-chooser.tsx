import { GoogleAppLine, GoogleScreen, type GoogleLayout } from './internal/google';

export interface GoogleAccount {
  name: string;
  email: string;
}

export interface GoogleAccountChooserProps {
  /** Your app, as Google shows it after the app is verified (Figma: `appName`). */
  appName?: string;
  /** m3: the new screen, in two panels; oauth: what Google shows today for sign-in from an app. */
  layout?: GoogleLayout;
  /** The accounts signed in on the browser (the Figma's accounts block): name, e-mail and the initial. */
  accounts?: GoogleAccount[];
  className?: string;
}

const SAMPLE: GoogleAccount[] = [
  { name: 'Maria Souza', email: 'maria.souza@gmail.com' },
  { name: 'Maria Souza', email: 'maria@empresa.com.br' },
];

/**
 * GoogleAccountChooser — Figma [RDS] External/GoogleAccountChooser. A MOCKUP of Google's account chooser, when the
 * person already has accounts on the browser, for flows: nothing in it works. Below 640 of container width it takes
 * the mobile layout (Figma: `screen`). "Adicionar outra conta" is Google's text; the rest is a translation (not
 * verified), as in the Figma. Styles: google-account-chooser.css and internal/google.css.
 */
export function GoogleAccountChooser({ appName = 'Rojão', layout = 'm3', accounts = SAMPLE, className }: GoogleAccountChooserProps) {
  return (
    <GoogleScreen
      layout={layout}
      label="Mockup: escolha de conta do Google"
      title="Escolha uma conta"
      intro={<GoogleAppLine lead="para prosseguir para" appName={appName} />}
      className={['rds-google-account-chooser', className].filter(Boolean).join(' ')}
    >
      <ul className="rds-google__accounts">
        {accounts.map((account) => (
          <li key={account.email} className="rds-google__account">
            <span className="rds-google__avatar" aria-hidden="true">
              {account.name.charAt(0).toUpperCase()}
            </span>
            <span className="rds-google__account-text">
              <span className="rds-google__account-name">{account.name}</span>
              <span className="rds-google__account-email">{account.email}</span>
            </span>
          </li>
        ))}
        <li className="rds-google__account">
          <span className="rds-google__add" aria-hidden="true">
            +
          </span>
          <span className="rds-google__account-name">Adicionar outra conta</span>
        </li>
      </ul>
      <p className="rds-google__text rds-google-account-chooser__notice">
        Para continuar, o Google vai compartilhar seu nome, endereço de e-mail, preferência de idioma e foto do perfil com
        o {appName}. Consulte a Política de Privacidade e os Termos de Serviço do app {appName} antes de usá-lo.
      </p>
    </GoogleScreen>
  );
}
