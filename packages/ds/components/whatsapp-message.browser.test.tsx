import { afterEach, describe, expect, it } from 'vitest';
import { WhatsAppChat } from './whatsapp-chat';
import { WhatsAppMessage, type WhatsAppMessageType, type WhatsAppPlatform } from './whatsapp-message';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const TYPES: WhatsAppMessageType[] = ['received', 'sent', 'delivered', 'read'];
const TEXT = 'Olá, Maria! Recebemos seu pedido e já estamos separando os itens.';

const all = (platform: WhatsAppPlatform) => (
  <div style={{ width: 360, display: 'grid', gap: 8 }}>
    {TYPES.map((type) => (
      <WhatsAppMessage key={type} platform={platform} type={type} text={TEXT} />
    ))}
  </div>
);

// The time on the green bubble (whatsapp/android/meta-out #657781 on bubble-out #d9fdd3) is 4.2:1, below 4.5:1 for
// 11px: a violation of the Figma (and of WhatsApp) itself, kept out and pinned with it.fails below.
const KNOWN_OUT = ['.rds-whatsapp-message--out .rds-whatsapp-message__meta'];

describe.each(MODES)('WhatsAppMessage (%s)', (mode) => {
  it('android: every type passes axe, apart from the time on the green bubble', async () => {
    const el = await render(all('android'), mode);
    expect(await axeViolations(el, KNOWN_OUT)).toEqual([]);
  });
});

describe('WhatsAppMessage behaviour', () => {
  it.fails('android: the time on the green bubble (whatsapp/android/meta-out on bubble-out) passes axe', async () => {
    const el = await render(all('android'));
    expect(await axeViolations(el)).toEqual([]);
  });

  // The ios meta colours the Figma measured (whatsapp/ios/meta #7f7f7f on white, 3.9:1; meta-out #6c7d69 on the green,
  // 4.0:1) are below 4.5:1 for the 11px time: a violation of the Figma (and of WhatsApp) itself, pinned here.
  it.fails('ios: every type passes axe (the 11px time in whatsapp/ios/meta and meta-out)', async () => {
    const el = await render(all('ios'));
    expect(await axeViolations(el)).toEqual([]);
  });

  it('ios passes axe apart from the time', async () => {
    const el = await render(all('ios'));
    expect(await axeViolations(el, ['.rds-whatsapp-message__meta'])).toEqual([]);
  });

  it('received on the left, the others on the right; the ticks are said in words', async () => {
    const el = await render(all('android'));
    const rows = [...el.querySelectorAll<HTMLElement>('.rds-whatsapp-message')];
    const box = el.firstElementChild!.getBoundingClientRect();
    expect(rows[0].querySelector('.rds-whatsapp-message__bubble')!.getBoundingClientRect().left).toBe(box.left);
    expect(rows[1].querySelector('.rds-whatsapp-message__bubble')!.getBoundingClientRect().right).toBe(box.right);
    expect(rows.map((r) => r.querySelector('.rds-visually-hidden')?.textContent ?? null)).toEqual([null, 'Enviada', 'Entregue', 'Lida']);
    expect(rows[1].querySelectorAll('.rds-whatsapp-message__ticks path')).toHaveLength(1);
    expect(rows[3].querySelector('.rds-whatsapp-message__ticks--read')).not.toBeNull();
  });

  it('inside a WhatsAppChat it takes the chat platform', async () => {
    const el = await render(
      <WhatsAppChat platform="ios">
        <WhatsAppMessage text="Oi" />
      </WhatsAppChat>,
    );
    expect(el.querySelector('.rds-whatsapp-message')!.className).toContain('rds-whatsapp--ios');
  });
});
