import { GoogleAccountChip, GoogleActions, GoogleAppLine, GoogleField, GoogleScreen, type GoogleLayout } from './internal/google';

export type { GoogleLayout };
export type GoogleSignInStep = 'email' | 'password';

export interface GoogleSignInProps {
  /** The screen's title (Figma: `title`). On the password step the Figma shows "Boas-vindas". */
  title?: string;
  /** Your app, as Google shows it after the app is verified (Figma: `appName`). */
  appName?: string;
  /** m3: the new screen, in two panels; oauth: what Google shows today for sign-in from an app. */
  layout?: GoogleLayout;
  /** email: the e-mail field; password: the account chip and the password field. */
  step?: GoogleSignInStep;
  /** The account on the password step. */
  email?: string;
  className?: string;
}

/**
 * GoogleSignIn — Figma [RDS] External/GoogleSignIn. A MOCKUP of Google's sign-in screen, for flows: nothing in it
 * works. Below 640 of container width it takes the mobile layout (Figma: `screen`). Texts of the e-mail step are
 * Google's; those of the password step are a translation (not verified), as in the Figma. Styles: google-sign-in.css
 * and internal/google.css.
 */
export function GoogleSignIn({
  title,
  appName = 'Rojão',
  layout = 'm3',
  step = 'email',
  email = 'ana@exemplo.com',
  className,
}: GoogleSignInProps) {
  const password = step === 'password';
  return (
    <GoogleScreen
      layout={layout}
      label="Mockup: login com o Google"
      title={title ?? (password ? 'Boas-vindas' : 'Faça login')}
      intro={password ? <GoogleAccountChip email={email} /> : <GoogleAppLine lead="Prosseguir para" appName={appName} />}
      className={['rds-google-sign-in', className].filter(Boolean).join(' ')}
    >
      {password ? (
        <>
          <GoogleField label="Digite sua senha" />
          <span className="rds-google__checkbox rds-google-sign-in__show">Mostrar senha</span>
          <GoogleActions secondary="Esqueceu a senha?" primary="Avançar" />
        </>
      ) : (
        <>
          <GoogleField label="E-mail ou telefone" state={layout === 'oauth' ? 'focus' : 'default'} />
          <span className="rds-google__link rds-google-sign-in__forgot">Esqueceu o e-mail?</span>
          <p className="rds-google__text rds-google-sign-in__notice">
            {layout === 'm3'
              ? 'Não está no seu computador? Use uma janela de navegação privada para fazer login.'
              : `Consulte a Política de Privacidade e os Termos de Serviço do app ${appName} antes de usá-lo.`}
          </p>
          <GoogleActions secondary="Criar conta" primary="Avançar" />
        </>
      )}
    </GoogleScreen>
  );
}
