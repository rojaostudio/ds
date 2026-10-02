import { afterEach, describe, expect, it } from 'vitest';
import { WhatsAppTemplate, WhatsAppTemplateButton, type WhatsAppTemplateHeader } from './whatsapp-template';
import type { WhatsAppPlatform } from './whatsapp-message';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const HEADERS: WhatsAppTemplateHeader[] = ['none', 'text', 'image'];

const all = (platform: WhatsAppPlatform) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
    {HEADERS.map((header) => (
      <WhatsAppTemplate
        key={header}
        platform={platform}
        header={header}
        headerText="Seu pedido foi recebido"
        body="Olá, Maria! Recebemos seu pedido e já estamos separando os itens. A loja responde por aqui."
        footer="Mercado Azul"
      >
        <WhatsAppTemplateButton type="url">Ver o pedido</WhatsAppTemplateButton>
        <WhatsAppTemplateButton type="quick-reply">Tenho interesse</WhatsAppTemplateButton>
        <WhatsAppTemplateButton type="phone">Ligar</WhatsAppTemplateButton>
      </WhatsAppTemplate>
    ))}
  </div>
);

describe.each(MODES)('WhatsAppTemplate (%s)', (mode) => {
  it('android: every header, with the buttons, passes axe', async () => {
    const el = await render(all('android'), mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('WhatsAppTemplate behaviour', () => {
  // The ios colours the Figma measured are below 4.5:1: the footer and time (whatsapp/ios/meta #7f7f7f, 3.9:1) and the
  // button label (whatsapp/ios/button-label #51a868, 2.9:1). A violation of the Figma (and of WhatsApp) itself.
  it.fails('ios: every header, with the buttons, passes axe', async () => {
    const el = await render(all('ios'));
    expect(await axeViolations(el)).toEqual([]);
  });

  it('ios passes axe apart from the meta and the button labels', async () => {
    const el = await render(all('ios'));
    const known = ['.rds-whatsapp-template__footer', '.rds-whatsapp-template__time', '.rds-whatsapp-template__button'];
    expect(await axeViolations(el, known)).toEqual([]);
  });

  // A used quick reply is grey on purpose (whatsapp/android/meta, whatsapp/ios/button-used #bdbdbd, 1.9:1).
  it.fails('a used quick reply passes axe (grey on purpose)', async () => {
    const el = await render(
      <WhatsAppTemplate platform="ios" body="Oi">
        <WhatsAppTemplateButton status="used">Tenho interesse</WhatsAppTemplateButton>
      </WhatsAppTemplate>,
    );
    expect(await axeViolations(el, ['.rds-whatsapp-template__time'])).toEqual([]);
  });

  it('header text, image, body, footer and time; the buttons 44 tall, the icon decorative; all-options has its label', async () => {
    const el = await render(
      <div>
        <WhatsAppTemplate header="text" headerText="Título" body="Corpo" footer="Rodapé" time="10:00">
          <WhatsAppTemplateButton type="all-options" />
        </WhatsAppTemplate>
        <WhatsAppTemplate header="image" image={<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Foto do produto" />} body="Corpo" />
      </div>,
    );
    const [text, image] = el.querySelectorAll('.rds-whatsapp-template');
    expect(text.querySelector('.rds-whatsapp-template__header')!.textContent).toBe('Título');
    expect(text.querySelector('.rds-whatsapp-template__footer')!.textContent).toBe('Rodapé');
    expect(text.querySelector('.rds-whatsapp-template__time')!.textContent).toBe('10:00');
    const button = text.querySelector<HTMLElement>('.rds-whatsapp-template__button')!;
    expect(button.textContent).toBe('Ver todas as opções');
    expect(button.offsetHeight).toBe(44);
    expect(button.querySelector('.rds-whatsapp-template__button-icon')!.getAttribute('aria-hidden')).toBe('true');
    expect(image.querySelector('.rds-whatsapp-template__image img')!.getAttribute('alt')).toBe('Foto do produto');
    expect(image.querySelector('.rds-whatsapp-template__header')).toBeNull();
    expect((text as HTMLElement).offsetWidth).toBe(280);
  });
});
