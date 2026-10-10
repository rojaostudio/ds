// text/selected: the text and icon of a selected item (the pressed Toggle, the current page of a Pagination) and the
// pressed Toggle's border. Measured on the rendered component, in light and dark, with the house theme and with a
// generated theme whose primary is light (#00aeef, with a secondary, so the primary stays the brand's own colour):
// text and icon 4.5:1 or more on the selected fill (and the Toggle's pressed hover), the border 3:1 on the surface.
import { afterEach, describe, expect, it } from 'vitest';
import { emitRdsCss, generateRdsTheme, type BrandDef } from '@rojaostudio/ds-core/generate';
import { Toggle } from '../toggle';
import { Pagination } from '../pagination';
import { MODES, cleanup, render } from './render';

type Rgba = [number, number, number, number];
const parse = (c: string): Rgba => {
  const [r, g, b, a = 1] = c.match(/\d+(\.\d+)?/g)!.map(Number);
  return [r, g, b, a];
};
/** `top` over the opaque `below`. */
const flat = (top: Rgba, below: Rgba): Rgba => [0, 1, 2].map((i) => top[i] * top[3] + below[i] * (1 - top[3])).concat(1) as Rgba;
const lum = ([r, g, b]: Rgba) => {
  const ch = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
const ratio = (a: Rgba, b: Rgba) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/** A theme role (or component token) resolved to its computed colour, on the page. */
const resolve = (v: string) => {
  const probe = document.createElement('span');
  probe.style.color = `var(${v})`;
  document.body.append(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c;
};

const Bold = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h8a4 4 0 0 1 0 8H6z" />
  </svg>
);

const lightPrimary = generateRdsTheme(
  { name: 'light-primary', brand: { primary: '#00aeef', secondary: '#1b2a4a' }, fonts: { body: 'inter' } } as BrandDef,
  { warn: () => {} },
);

let brandStyle: HTMLStyleElement | null = null;
afterEach(() => {
  brandStyle?.remove();
  brandStyle = null;
  cleanup();
});

describe.each([
  ['house theme', null],
  ['generated light primary #00aeef', lightPrimary],
] as const)('text/selected (%s)', (_, theme) => {
  const useTheme = () => {
    if (!theme) return;
    brandStyle = document.createElement('style');
    brandStyle.textContent = emitRdsCss(theme);
    document.head.appendChild(brandStyle);
  };

  it.each(MODES)('%s: the pressed Toggle, label and icon 4.5:1 on its fill and its hover fill, border 3:1 on the surface', async (mode) => {
    useTheme();
    const el = await render(
      <Toggle variant="outline" icon={<Bold />} defaultPressed>
        Negrito
      </Toggle>,
      mode,
    );
    const b = el.querySelector('button')!;
    const s = getComputedStyle(b);
    const card = parse(resolve('--surface-card'));
    const page = parse(resolve('--surface-page'));
    expect(s.color).toBe(resolve('--text-selected'));
    expect(s.borderTopColor).toBe(resolve('--text-selected'));
    const label = parse(s.color);
    const icon = parse(getComputedStyle(b.querySelector('svg')!).fill);
    for (const fill of [s.backgroundColor, resolve('--toggle-background-pressed-hover')]) {
      const bg = flat(parse(fill), card);
      expect(ratio(label, bg)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(icon, bg)).toBeGreaterThanOrEqual(4.5);
    }
    const border = parse(s.borderTopColor);
    for (const surface of [card, page]) expect(ratio(border, surface)).toBeGreaterThanOrEqual(3);
  });

  it.each(MODES)('%s: the current page, its number 4.5:1 on its fill', async (mode) => {
    useTheme();
    const el = await render(<Pagination page={2} totalPages={5} onChange={() => {}} />, mode);
    const current = el.querySelector<HTMLElement>('[aria-current="page"]')!;
    const s = getComputedStyle(current);
    expect(s.color).toBe(resolve('--text-selected'));
    const bg = flat(parse(s.backgroundColor), parse(resolve('--surface-card')));
    expect(ratio(parse(s.color), bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('text/selected with a light primary', () => {
  it('is not the primary itself in light (a darker step of its ramp), and the brand is in force', async () => {
    const theme = lightPrimary;
    brandStyle = document.createElement('style');
    brandStyle.textContent = emitRdsCss(theme);
    document.head.appendChild(brandStyle);
    await render(<Toggle defaultPressed>Negrito</Toggle>, 'light');
    expect(resolve('--colors-primary-default')).toBe('rgb(0, 174, 239)');
    expect(resolve('--text-selected')).not.toBe('rgb(0, 174, 239)');
    expect(theme.light['--text-selected']).not.toBe(theme.light['--colors-primary-default']);
  });
});
