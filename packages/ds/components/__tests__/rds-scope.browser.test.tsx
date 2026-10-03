/**
 * A theme emitted for an own scope (emitRdsCss with scope/dark) must reach the components inside it. A component
 * token holds var(--theme-role) and is resolved where it is declared, so the scope element has to be one the
 * component token layer is redeclared on: the generic attributes data-rds-scope / data-rds-mode / data-rds-plate,
 * or the root (next-themes sets data-theme on <html>). emitRdsCss refuses the selectors that are not.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { emitRdsCss, generateRdsTheme, type BrandDef, type RdsCssOptions } from '@rojaostudio/ds-core/generate';
import { Card, CardContent } from '../card';
import { cleanup, render } from './render';

const theme = generateRdsTheme({ name: 'sample', brand: { primary: '#0a7e1c' }, fonts: { body: 'inter' } } as BrandDef);
theme.light['--surface-card'] = '#fff7e6';
theme.dark['--surface-card'] = '#101820';

let style: HTMLStyleElement | null = null;
function inject(opts: RdsCssOptions) {
  style = document.createElement('style');
  style.textContent = emitRdsCss(theme, opts);
  document.head.appendChild(style);
}

afterEach(() => {
  style?.remove();
  style = null;
  delete document.documentElement.dataset.theme;
  act(() => cleanup());
});

const card = (el: HTMLElement, id: string) => getComputedStyle(el.querySelector<HTMLElement>(`#${id} .rds-card`)!).backgroundColor;
const sample = (id: string) => (
  <Card id={id}>
    <CardContent>Até 3 pedidos.</CardContent>
  </Card>
);

describe('emitRdsCss with an own scope, in the browser', () => {
  it('a scope with data-rds-scope repaints the components inside, light and dark', async () => {
    inject({ scope: '.my-scope[data-rds-scope]', dark: '[data-rds-mode="dark"]' });
    const el = await render(
      <>
        <div id="out">{sample('a')}</div>
        <div id="in" className="my-scope" data-rds-scope="">{sample('b')}</div>
        <div data-rds-mode="dark">
          <div id="in-dark" className="my-scope" data-rds-scope="">{sample('c')}</div>
        </div>
      </>,
    );
    expect(getComputedStyle(el.querySelector<HTMLElement>('#out .rds-card')!).backgroundColor).toBe('rgb(255, 255, 255)');
    expect(getComputedStyle(el.querySelector<HTMLElement>('#in .rds-card')!).backgroundColor).toBe('rgb(255, 247, 230)');
    expect(getComputedStyle(el.querySelector<HTMLElement>('#in-dark .rds-card')!).backgroundColor).toBe('rgb(16, 24, 32)');
  });

  it('without the attribute (allowUncovered) the components keep the root colours: the case emitRdsCss refuses', async () => {
    expect(() => emitRdsCss(theme, { scope: '.my-scope' })).toThrow(/not covered/);
    inject({ scope: '.my-scope', allowUncovered: true });
    const el = await render(<div id="in" className="my-scope">{sample('b')}</div>);
    const scope = el.querySelector<HTMLElement>('#in')!;
    expect(getComputedStyle(scope).getPropertyValue('--surface-card').trim()).toBe('#fff7e6');
    expect(card(el, 'in')).toBe('rgb(255, 255, 255)');
  });

  it('next-themes with attribute="data-theme": the dark selector anchored at the root', async () => {
    expect(() => emitRdsCss(theme, { scope: ':root', dark: '[data-theme="dark"]' })).toThrow(/:root\[data-theme="dark"\]/);
    inject({ scope: ':root', dark: ':root[data-theme="dark"]' });
    const el = await render(<div id="x">{sample('a')}</div>);
    expect(card(el, 'x')).toBe('rgb(255, 247, 230)');
    document.documentElement.dataset.theme = 'dark';
    expect(card(el, 'x')).toBe('rgb(16, 24, 32)');
  });

  it('the shipped theme: a nested data-rds-mode="dark" section repaints its components', async () => {
    const el = await render(
      <>
        <div id="light">{sample('a')}</div>
        <section id="dark" data-rds-mode="dark">{sample('b')}</section>
      </>,
    );
    expect(card(el, 'light')).toBe('rgb(255, 255, 255)');
    // surface/card in dark: zinc/900.
    expect(card(el, 'dark')).toBe('rgb(24, 24, 27)');
  });
});
