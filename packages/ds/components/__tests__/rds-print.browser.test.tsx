/**
 * Print (#42): the shipped theme ends with an `@media print` block, the light mode with white backgrounds and clear
 * shadows over every scope. Chromium is switched to the print media type (page.emulateMedia, through the
 * emulateMedia command of vitest.config.ts) and a Card is measured in light, dark and on the plate.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { Card, CardContent } from '../card';
import { cleanup, render, renderIn, setMedia, type Scheme } from './render';

afterEach(async () => {
  await setMedia(null);
  act(() => cleanup());
});

const sample = (
  <Card>
    <CardContent>Até 3 pedidos.</CardContent>
  </Card>
);
const card = (el: HTMLElement) => getComputedStyle(el.querySelector<HTMLElement>('.rds-card')!);
const role = (el: HTMLElement, name: string) => card(el).getPropertyValue(name).trim();

/** The card on screen in light: the colours print has to keep. */
async function lightOnScreen() {
  const el = await render(sample, 'light');
  const s = card(el);
  return { color: s.color, border: s.borderTopColor };
}

describe('the print mode, in the browser', () => {
  it('matches print and not screen', async () => {
    expect(matchMedia('print').matches).toBe(false);
    await setMedia('print');
    expect(matchMedia('print').matches).toBe(true);
  });

  for (const scheme of ['light', 'dark', 'plate'] as Scheme[]) {
    it(`${scheme}: white backgrounds, light borders and text, no shadow`, async () => {
      const light = await lightOnScreen();
      const onScreen = await renderIn(sample, scheme);
      const screenShadow = card(onScreen).boxShadow;
      await setMedia('print');
      const el = await renderIn(sample, scheme);
      const s = card(el);
      expect(s.backgroundColor).toBe('rgb(255, 255, 255)');
      expect(s.color).toBe(light.color);
      expect(s.borderTopColor).toBe(light.border);
      for (const bg of ['--surface-page', '--surface-muted', '--surface-tint-default', '--surface-attention-high'])
        expect(role(el, bg), bg).toBe('#ffffff');
      // Every layer of the elevation is a transparent shadow.
      expect(screenShadow).toMatch(/rgba\(0, 0, 0, 0\.\d+\)/);
      expect(s.boxShadow.match(/rgba?\([^)]*\)/g)?.every((c) => c === 'rgba(0, 0, 0, 0)')).toBe(true);
    });
  }

  it('the media type variables: the screen type on screen, points on paper', async () => {
    const el = await render(sample, 'dark');
    const v = (name: string) => role(el, name);
    expect(v('--media-type-body-size')).toBe('16px');
    expect(v('--media-type-title-line')).toBe('30px');
    await setMedia('print');
    const sizes = ['caption', 'small', 'body', 'label', 'title'].map((r) => `${v(`--media-type-${r}-size`)}/${v(`--media-type-${r}-line`)}`);
    expect(sizes).toEqual(['8pt/10pt', '9pt/12pt', '10pt/14pt', '12pt/16pt', '18pt/24pt']);
  });
});
