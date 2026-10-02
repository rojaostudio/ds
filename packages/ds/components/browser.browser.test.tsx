import { afterEach, describe, expect, it } from 'vitest';
import { Browser } from './browser';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const page = <p style={{ margin: 16 }}>Página do produto</p>;

describe.each(MODES)('Browser (%s)', (mode) => {
  it('passes axe', async () => {
    const el = await render(
      <div style={{ width: 1280 }}>
        <Browser url="exemplo.com.br">{page}</Browser>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Browser behaviour', () => {
  it('1280 wide at most, a 52 toolbar and the page in 1278 × 746; it narrows and keeps the proportion', async () => {
    const el = await render(
      <div>
        <div style={{ width: 1400 }}>
          <Browser>{page}</Browser>
        </div>
        <div style={{ width: 641 }}>
          <Browser>{page}</Browser>
        </div>
      </div>,
    );
    const [full, half] = el.querySelectorAll<HTMLElement>('.rds-browser');
    expect(full.offsetWidth).toBe(1280);
    expect(full.querySelector<HTMLElement>('.rds-browser__toolbar')!.offsetHeight).toBe(52);
    const screen = full.querySelector('.rds-browser__screen')!.getBoundingClientRect();
    expect([screen.width, Math.round(screen.height)]).toEqual([1278, 746]);
    const small = half.querySelector('.rds-browser__screen')!.getBoundingClientRect();
    expect(Math.round(small.height)).toBe(373);
  });

  it('the toolbar is decorative and shows the url; the page is live', async () => {
    const el = await render(<Browser url="exemplo.com.br/pedidos">{page}</Browser>);
    const toolbar = el.querySelector('.rds-browser__toolbar')!;
    expect(toolbar.getAttribute('aria-hidden')).toBe('true');
    expect(toolbar.querySelector('.rds-browser__address')!.textContent).toBe('exemplo.com.br/pedidos');
    expect(el.querySelector('.rds-browser__screen')!.textContent).toBe('Página do produto');
  });
});

describe('Browser theme', () => {
  it('the window follows the theme (browser/*): it changes in dark mode; the window buttons stay macOS red, yellow, green', async () => {
    const paint = (el: HTMLElement) => ({
      toolbar: getComputedStyle(el.querySelector('.rds-browser__toolbar')!).backgroundColor,
      screen: getComputedStyle(el.querySelector('.rds-browser__screen')!).backgroundColor,
      close: getComputedStyle(el.querySelector('.rds-browser__controls > span')!).backgroundColor,
    });
    const light = paint(await render(<Browser>{page}</Browser>, 'light'));
    const dark = paint(await render(<Browser>{page}</Browser>, 'dark'));
    expect(dark.toolbar).not.toBe(light.toolbar);
    expect(dark.screen).not.toBe(light.screen);
    expect([light.close, dark.close]).toEqual(['rgb(255, 95, 87)', 'rgb(255, 95, 87)']);
  });
});
