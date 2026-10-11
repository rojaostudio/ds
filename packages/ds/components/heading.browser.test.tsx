import { afterEach, describe, expect, it } from 'vitest';
import { emitRdsCss, generateRdsTheme, type BrandDef, type RdsTheme } from '@rojaostudio/ds-core/generate';
import { Heading, type HeadingLevel } from './heading';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

let brandStyle: HTMLStyleElement | null = null;
afterEach(() => {
  brandStyle?.remove();
  brandStyle = null;
  cleanup();
});

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

// [RDS] rojao: heading/default → text/heading (navy-900 on light, zinc-50 on dark, white on the plate);
// heading/accent → text/accent (flare-800 on light, flare-700 on dark, flare-300 on the plate).
const DEFAULT = { light: '#1b2a4a', dark: '#fafafa' } as const;
const ACCENT = { light: '#d95a00', dark: '#ff6a00' } as const;

const LEVELS: Array<[HeadingLevel, string, string]> = [
  ['band', '36px', '48px'],
  ['heading', '24px', '30px'],
  ['value', '20px', '30px'],
];

const title = (tone: 'neutral' | 'accent' = 'neutral') => (
  <Heading tone={tone}>
    Entregas da <Heading.Mark>semana</Heading.Mark>
  </Heading>
);

describe.each(MODES)('Heading (%s)', (mode) => {
  it('is an h2 by default, in heading/default (tone neutral), and passes axe', async () => {
    const el = await render(<Heading>Entregas da semana</Heading>, mode);
    const h = el.querySelector('h2')!;
    expect(h.className).toContain('rds-heading--heading');
    expect(getComputedStyle(h).color).toBe(rgb(DEFAULT[mode]));
    expect(await axeViolations(el)).toEqual([]);
  });

  it('paints the mark in the other colour of the pair', async () => {
    const el = await render(<div>{title('neutral')}{title('accent')}</div>, mode);
    const [plain, accent] = el.querySelectorAll<HTMLElement>('.rds-heading');
    expect(getComputedStyle(plain).color).toBe(rgb(DEFAULT[mode]));
    expect(getComputedStyle(plain.querySelector('.rds-heading__mark')!).color).toBe(rgb(ACCENT[mode]));
    expect(getComputedStyle(accent).color).toBe(rgb(ACCENT[mode]));
    expect(getComputedStyle(accent.querySelector('.rds-heading__mark')!).color).toBe(rgb(DEFAULT[mode]));
  });

  it('a default Heading with a mark, and an accent one, pass axe', async () => {
    const el = await render(<div>{title('neutral')}{title('accent')}</div>, mode);
    expect(await axeViolations(el)).toEqual([]);
  });

  it.each(LEVELS)('level=%s follows the type scale, bold', async (level, size, line) => {
    const el = await render(<Heading level={level}>Entregas</Heading>, mode);
    const style = getComputedStyle(el.querySelector('.rds-heading')!);
    expect(style.fontSize).toBe(size);
    expect(style.lineHeight).toBe(line);
    expect(style.fontWeight).toBe('700');
  });
});

describe('Heading on dark and on the plate', () => {
  it('tone=accent passes axe on dark (flare-700 on the dark page)', async () => {
    const el = await render(title('accent'), 'dark');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('both tones pass axe on the brand plate (white and flare-300 on navy-900)', async () => {
    const el = await render(
      <div className="ds-plate" style={{ background: 'var(--surface-page)', padding: 16 }}>
        {title('neutral')}
        {title('accent')}
      </div>,
      'light',
    );
    const [plain] = el.querySelectorAll<HTMLElement>('.rds-heading');
    expect(getComputedStyle(plain).color).toBe(rgb('#ffffff'));
    expect(await axeViolations(el)).toEqual([]);
  });

});

// heading/accent → text/accent: the accent as large text, 3:1 or more on surface/page and surface/card, in light and
// dark, with the house theme and with generated themes whose accent is light (a yellow, a cyan: under 3:1 on white
// as they are, so text/accent goes down their ramp).
type Rgb = [number, number, number];
const parse = (c: string): Rgb => c.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number) as Rgb;
const lum = ([r, g, b]: Rgb) => {
  const ch = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
const ratio = (a: Rgb, b: Rgb) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** A theme role resolved to its computed colour, inside `el`. */
const resolveIn = (el: Element, v: string) => {
  const probe = document.createElement('span');
  probe.style.color = `var(${v})`;
  el.append(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c;
};
const accentTheme = (accent: string) =>
  generateRdsTheme(
    { name: 'accent', brand: { primary: '#1b2a4a', secondary: '#1b2a4a', accent }, fonts: { body: 'inter' } } as BrandDef,
    { warn: () => {} },
  );

describe.each([
  ['house theme', null],
  ['generated yellow accent #ffd200', accentTheme('#ffd200')],
  ['generated cyan accent #00aeef', accentTheme('#00aeef')],
] as Array<[string, RdsTheme | null]>)('Heading accent contrast (%s)', (_, theme) => {
  it.each(MODES)('%s: tone=accent and the mark are text/accent, 3:1 or more on page and card, and pass axe', async (mode) => {
    if (theme) {
      brandStyle = document.createElement('style');
      brandStyle.textContent = emitRdsCss(theme);
      document.head.appendChild(brandStyle);
    }
    const el = await render(<div>{title('neutral')}{title('accent')}</div>, mode);
    const [plain, accent] = el.querySelectorAll<HTMLElement>('.rds-heading');
    const text = resolveIn(el, '--text-accent');
    expect(getComputedStyle(accent).color).toBe(text);
    expect(getComputedStyle(plain.querySelector('.rds-heading__mark')!).color).toBe(text);
    for (const surface of ['--surface-page', '--surface-card'])
      expect(ratio(parse(text), parse(resolveIn(el, surface))), surface).toBeGreaterThanOrEqual(3);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Heading behaviour', () => {
  it('takes the element from `as`, not from the level', async () => {
    const el = await render(
      <Heading as="h1" level="value" id="t">
        Painel
      </Heading>,
    );
    const h = el.querySelector('h1')!;
    expect(h.id).toBe('t');
    expect(h.className).toContain('rds-heading--value');
  });

  it('reads the whole title, mark included, as one name', async () => {
    const el = await render(title());
    expect(el.querySelector('h2')!.textContent).toBe('Entregas da semana');
    expect(el.querySelector('.rds-heading__mark')!.tagName).toBe('SPAN');
  });

  it('align="center" wraps a long title centred (an access card, 376 wide)', async () => {
    const el = await render(
      <div style={{ width: 376 }}>
        <Heading align="center">Quer começar com um catálogo pronto?</Heading>
      </div>,
    );
    const h = el.querySelector('h2')!;
    expect(getComputedStyle(h).textAlign).toBe('center');
    expect(h.getBoundingClientRect().height).toBeGreaterThan(30);
  });

  it('starts aligned to the start by default', async () => {
    const el = await render(<Heading>Pedidos</Heading>);
    expect(getComputedStyle(el.querySelector('h2')!).textAlign).toBe('start');
  });
});
