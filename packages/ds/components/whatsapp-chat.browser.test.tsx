import { afterEach, describe, expect, it } from 'vitest';
import { WhatsAppChat } from './whatsapp-chat';
import { WhatsAppMessage } from './whatsapp-message';
import { WhatsAppTemplate, WhatsAppTemplateButton } from './whatsapp-template';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// The business's picture comes by slot: the design system carries no client logo. A letter stands in for it here.
const chat = (platform: 'android' | 'ios', showVerified = false) => (
  <WhatsAppChat platform={platform} name="Mercado Azul" showVerified={showVerified} avatar={<span aria-hidden="true">M</span>}>
    <WhatsAppTemplate header="text" headerText="Seu pedido foi recebido" body="Olá, Maria! Recebemos seu pedido.">
      <WhatsAppTemplateButton type="url">Ver o pedido</WhatsAppTemplateButton>
    </WhatsAppTemplate>
    <WhatsAppMessage type="read" text="Obrigada!" />
  </WhatsAppChat>
);

// The ios meta and button colours the Figma measured (whatsapp/ios/meta #7f7f7f, 3.9:1; button-label #51a868, 2.9:1)
// are below 4.5:1: a violation of the Figma (and of WhatsApp) itself. Kept out and pinned with it.fails below.
// On android, only the time on the green bubble (meta-out on bubble-out, 4.2:1), as in whatsapp-message.browser.test.
const KNOWN_ANDROID = ['.rds-whatsapp-message--out .rds-whatsapp-message__meta'];
const KNOWN_IOS = [
  '.rds-whatsapp-chat__placeholder',
  '.rds-whatsapp-chat__subtitle',
  '.rds-whatsapp-chat__date',
  '.rds-whatsapp-template__time',
  '.rds-whatsapp-template__button',
  '.rds-whatsapp-message__meta',
];

describe.each(MODES)('WhatsAppChat (%s)', (mode) => {
  it('android, verified, passes axe apart from the time on the green bubble', async () => {
    const el = await render(chat('android', true), mode);
    expect(await axeViolations(el, KNOWN_ANDROID)).toEqual([]);
  });

  it('ios passes axe apart from the measured greys', async () => {
    const el = await render(chat('ios'), mode);
    expect(await axeViolations(el, KNOWN_IOS)).toEqual([]);
  });
});

describe('WhatsAppChat behaviour', () => {
  it.fails('android passes axe (whatsapp/android/meta-out on bubble-out below 4.5:1)', async () => {
    const el = await render(chat('android'));
    expect(await axeViolations(el)).toEqual([]);
  });

  it.fails('ios passes axe (whatsapp/ios/meta and button-label below 4.5:1)', async () => {
    const el = await render(chat('ios'));
    expect(await axeViolations(el)).toEqual([]);
  });

  it('a named group 360 × 780: the header with the name, the day, the notice and the messages; the bars decorative', async () => {
    const el = await render(chat('android', true));
    const root = el.querySelector<HTMLElement>('.rds-whatsapp-chat')!;
    expect(root.getAttribute('role')).toBe('group');
    expect(root.getAttribute('aria-label')).toBe('Mockup: conversa do WhatsApp com Mercado Azul');
    expect([root.offsetWidth, root.offsetHeight]).toEqual([360, 780]);
    expect(root.querySelector('.rds-whatsapp-chat__name')!.textContent).toBe('Mercado Azul(verificada)');
    expect(root.querySelector('.rds-whatsapp-chat__status')!.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('.rds-whatsapp-chat__composer')!.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelectorAll('.rds-whatsapp-chat__messages > *')).toHaveLength(2);
    // The messages follow the chat's platform.
    expect(root.querySelector('.rds-whatsapp-template')!.className).toContain('rds-whatsapp--android');
  });
});
