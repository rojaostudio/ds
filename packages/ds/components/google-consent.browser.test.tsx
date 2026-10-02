import { afterEach, describe, expect, it } from 'vitest';
import { GoogleConsent } from './google-consent';
import { InContainer, WIDTHS } from './__tests__/blocks';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('GoogleConsent (%s)', (mode) => {
  it.each(WIDTHS)('m3 and oauth in a %i container pass axe', async (width) => {
    const el = await render(
      <div>
        <InContainer width={width}>
          <GoogleConsent />
        </InContainer>
        <InContainer width={width}>
          <GoogleConsent layout="oauth" />
        </InContainer>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('GoogleConsent behaviour', () => {
  it('names the app in the title and in what Google shares; the account chip and the actions', async () => {
    const el = await render(<GoogleConsent appName="Mercado Azul" email="ana@gmail.com" />);
    expect(el.querySelector('.rds-google__title')!.textContent).toBe('Fazer login no Mercado Azul');
    expect(el.querySelector('.rds-google__text')!.textContent).toContain('foto do perfil com o Mercado Azul');
    expect(el.querySelector('.rds-google__chip')!.textContent).toContain('ana@gmail.com');
    expect(el.querySelector('.rds-google__actions')!.textContent).toBe('CancelarContinuar');
  });

  it('follows the container: the oauth card 450 wide at 1024, edge to edge at 360', async () => {
    const wide = await render(
      <InContainer width={1024}>
        <GoogleConsent layout="oauth" />
      </InContainer>,
    );
    expect(wide.querySelector('.rds-google__card')!.getBoundingClientRect().width).toBe(450);
    const narrow = await render(
      <InContainer width={360}>
        <GoogleConsent layout="oauth" />
      </InContainer>,
    );
    expect(narrow.querySelector('.rds-google__card')!.getBoundingClientRect().width).toBe(360);
  });
});
