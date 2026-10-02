import { afterEach, describe, expect, it } from 'vitest';
import { WhatsAppNotification } from './whatsapp-notification';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const MESSAGE = 'Olá, Maria! Recebemos seu pedido e já estamos separando os itens.';

describe.each(MODES)('WhatsAppNotification (%s)', (mode) => {
  it('android and ios pass axe', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 16 }}>
        <WhatsAppNotification title="Mercado Azul" message={MESSAGE} avatar={<span aria-hidden="true">M</span>} />
        <WhatsAppNotification platform="ios" title="Mercado Azul" message={MESSAGE} avatar={<span aria-hidden="true">M</span>} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('WhatsAppNotification behaviour', () => {
  it('a named group 360 × 780 with the sender, the time and the message; the clock decorative', async () => {
    const el = await render(<WhatsAppNotification title="Mercado Azul" message={MESSAGE} when="agora" />);
    const root = el.querySelector<HTMLElement>('.rds-whatsapp-notification')!;
    expect(root.getAttribute('aria-label')).toBe('Mockup: notificação do WhatsApp');
    expect([root.offsetWidth, root.offsetHeight]).toEqual([360, 780]);
    expect(root.querySelector('.rds-whatsapp-notification__clock')!.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('.rds-whatsapp-notification__title')!.textContent).toBe('Mercado Azul');
    expect(root.querySelector('.rds-whatsapp-notification__app-row')!.textContent).toContain('WhatsApp');
    expect(root.querySelector('.rds-whatsapp-notification__message')!.textContent).toBe(MESSAGE);
  });

  it('ios puts the app icon over the picture and the time next to the title', async () => {
    const el = await render(<WhatsAppNotification platform="ios" message={MESSAGE} />);
    const picture = el.querySelector('.rds-whatsapp-notification__picture')!;
    expect(picture.querySelector('.rds-whatsapp-notification__app')).not.toBeNull();
    expect(el.querySelector('.rds-whatsapp-notification__title-row')!.textContent).toBe('Rojãoagora');
  });
});

describe('WhatsAppNotification theme', () => {
  it('the card follows the theme (whatsapp/notification/*): it changes in dark mode; the wallpaper does not', async () => {
    const paint = (el: HTMLElement) => ({
      card: getComputedStyle(el.querySelector('.rds-whatsapp-notification__card')!).backgroundColor,
      message: getComputedStyle(el.querySelector('.rds-whatsapp-notification__message')!).color,
      wallpaper: getComputedStyle(el.querySelector('.rds-whatsapp-notification')!).backgroundImage,
    });
    const light = paint(await render(<WhatsAppNotification message={MESSAGE} />, 'light'));
    const dark = paint(await render(<WhatsAppNotification message={MESSAGE} />, 'dark'));
    expect(dark.card).not.toBe(light.card);
    expect(dark.message).not.toBe(light.message);
    expect(dark.wallpaper).toBe(light.wallpaper);
  });
});
