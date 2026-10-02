import { afterEach, describe, expect, it } from 'vitest';
import { Phone, type PhonePlatform } from './phone';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const PLATFORMS: PhonePlatform[] = ['ios', 'android'];
const screen = <p style={{ margin: 16 }}>Tela do produto</p>;

describe.each(MODES)('Phone (%s)', (mode) => {
  it('ios and android, with and without the browser, pass axe', async () => {
    const el = await render(
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {PLATFORMS.flatMap((platform) => [
          <Phone key={`${platform}-b`} platform={platform}>
            {screen}
          </Phone>,
          <Phone key={`${platform}-n`} platform={platform} browser={false}>
            {screen}
          </Phone>,
        ])}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Phone behaviour', () => {
  it('measures 414 × 868 (ios) and 436 × 939 (android); the screen is 390 × 700 and 412 × 795 with the browser', async () => {
    const el = await render(
      <div>
        <Phone platform="ios">{screen}</Phone>
        <Phone platform="android">{screen}</Phone>
      </div>,
    );
    const [ios, android] = el.querySelectorAll<HTMLElement>('.rds-phone');
    expect([ios.offsetWidth, ios.offsetHeight]).toEqual([414, 868]);
    expect([android.offsetWidth, android.offsetHeight]).toEqual([436, 939]);
    const box = (phone: HTMLElement) => phone.querySelector<HTMLElement>('.rds-phone__screen')!.getBoundingClientRect();
    expect([box(ios).width, box(ios).height]).toEqual([390, 700]);
    expect([box(android).width, box(android).height]).toEqual([412, 795]);
  });

  it('the bars are decorative; the url shows in the address; without the browser there is no address', async () => {
    const el = await render(
      <div>
        <Phone url="exemplo.com.br/pedidos">{screen}</Phone>
        <Phone browser={false}>{screen}</Phone>
      </div>,
    );
    const [withBrowser, without] = el.querySelectorAll<HTMLElement>('.rds-phone');
    const bar = withBrowser.querySelector('.rds-phone__browser')!;
    expect(bar.getAttribute('aria-hidden')).toBe('true');
    expect(bar.textContent).toBe('exemplo.com.br/pedidos');
    expect(withBrowser.querySelector('.rds-phone__status')!.getAttribute('aria-hidden')).toBe('true');
    expect(without.querySelector('.rds-phone__browser')).toBeNull();
    expect(withBrowser.querySelector('.rds-phone__screen')!.textContent).toBe('Tela do produto');
  });
});

describe('Phone theme', () => {
  it('the interface follows the theme (phone/*): it changes in dark mode; the frame stays the device', async () => {
    const paint = (el: HTMLElement) => ({
      frame: getComputedStyle(el.querySelector('.rds-phone')!).backgroundColor,
      screen: getComputedStyle(el.querySelector('.rds-phone__screen')!).backgroundColor,
      bar: getComputedStyle(el.querySelector('.rds-phone__browser')!).backgroundColor,
      text: getComputedStyle(el.querySelector('.rds-phone__screen p')!).color,
    });
    const light = paint(await render(<Phone>{screen}</Phone>, 'light'));
    const dark = paint(await render(<Phone>{screen}</Phone>, 'dark'));
    expect(dark.screen).not.toBe(light.screen);
    expect(dark.bar).not.toBe(light.bar);
    expect(dark.text).not.toBe(light.text);
    expect(dark.frame).toBe(light.frame);
  });
});
