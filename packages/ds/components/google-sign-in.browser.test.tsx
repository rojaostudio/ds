import { afterEach, describe, expect, it } from 'vitest';
import { GoogleSignIn, type GoogleLayout, type GoogleSignInStep } from './google-sign-in';
import { InContainer, WIDTHS } from './__tests__/blocks';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const LAYOUTS: GoogleLayout[] = ['m3', 'oauth'];
const STEPS: GoogleSignInStep[] = ['email', 'password'];

describe.each(MODES)('GoogleSignIn (%s)', (mode) => {
  it.each(WIDTHS)('every layout × step in a %i container passes axe', async (width) => {
    const el = await render(
      <div>
        {LAYOUTS.flatMap((layout) =>
          STEPS.map((step) => (
            <InContainer key={`${layout}-${step}`} width={width}>
              <GoogleSignIn layout={layout} step={step} />
            </InContainer>
          )),
        )}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('GoogleSignIn behaviour', () => {
  it('a named group with the screen texts; the app name in the subtitle; the password step shows the account', async () => {
    const el = await render(
      <div>
        <GoogleSignIn appName="Mercado Azul" />
        <GoogleSignIn step="password" email="ana@gmail.com" layout="oauth" />
      </div>,
    );
    const [email, password] = el.querySelectorAll('.rds-google');
    expect(email.getAttribute('role')).toBe('group');
    expect(email.getAttribute('aria-label')).toBe('Mockup: login com o Google');
    expect(email.querySelector('.rds-google__title')!.textContent).toBe('Faça login');
    expect(email.querySelector('.rds-google__subtitle')!.textContent).toBe('Prosseguir para Mercado Azul');
    expect(email.querySelector('.rds-google__field-label')!.textContent).toBe('E-mail ou telefone');
    expect(password.querySelector('.rds-google__title')!.textContent).toBe('Boas-vindas');
    expect(password.querySelector('.rds-google__chip')!.textContent).toContain('ana@gmail.com');
    expect(password.querySelector('.rds-google__header')!.textContent).toBe('Fazer Login com o Google');
    // A mockup: nothing in it is a control.
    expect(el.querySelectorAll('button, input, a')).toHaveLength(0);
  });

  it('follows the container: m3 in two panels at 1024, stacked at 360', async () => {
    const wide = await render(
      <InContainer width={1024}>
        <GoogleSignIn />
      </InContainer>,
    );
    expect(getComputedStyle(wide.querySelector('.rds-google__body')!).flexDirection).toBe('row');
    expect(getComputedStyle(wide.querySelector('.rds-google__card')!).borderTopLeftRadius).toBe('28px');
    const narrow = await render(
      <InContainer width={360}>
        <GoogleSignIn />
      </InContainer>,
    );
    expect(getComputedStyle(narrow.querySelector('.rds-google__body')!).flexDirection).toBe('column');
    expect(getComputedStyle(narrow.querySelector('.rds-google__title')!).fontSize).toBe('32px');
  });
});
