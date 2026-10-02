import { afterEach, describe, expect, it } from 'vitest';
import { GoogleAccountChooser } from './google-account-chooser';
import { InContainer, WIDTHS } from './__tests__/blocks';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('GoogleAccountChooser (%s)', (mode) => {
  it.each(WIDTHS)('m3 and oauth in a %i container pass axe', async (width) => {
    const el = await render(
      <div>
        <InContainer width={width}>
          <GoogleAccountChooser />
        </InContainer>
        <InContainer width={width}>
          <GoogleAccountChooser layout="oauth" />
        </InContainer>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('GoogleAccountChooser behaviour', () => {
  it('lists the accounts (initial, name, e-mail) and "Adicionar outra conta"; the app in the subtitle', async () => {
    const el = await render(
      <GoogleAccountChooser
        appName="Mercado Azul"
        accounts={[
          { name: 'Ana Souza', email: 'ana@gmail.com' },
          { name: 'Bruno Reis', email: 'bruno@empresa.com.br' },
          { name: 'Carla Dias', email: 'carla@gmail.com' },
        ]}
      />,
    );
    const rows = el.querySelectorAll('.rds-google__accounts > li');
    expect(rows).toHaveLength(4);
    expect(rows[1].textContent).toBe('BBruno Reisbruno@empresa.com.br');
    expect(rows[1].querySelector('.rds-google__avatar')!.getAttribute('aria-hidden')).toBe('true');
    expect(rows[3].textContent).toContain('Adicionar outra conta');
    expect(el.querySelector('.rds-google__subtitle')!.textContent).toBe('para prosseguir para Mercado Azul');
  });
});
