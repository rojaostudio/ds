import { afterEach, describe, expect, it } from 'vitest';
import { Heading, type HeadingLevel } from './heading';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

// [RDS] rojao: heading/default → text/heading (navy-900 on light, zinc-50 on dark, white on the plate);
// heading/accent → colors/accent/default (flare-700 on light, flare-300 on dark and on the plate).
const DEFAULT = { light: '#1b2a4a', dark: '#fafafa' } as const;
const ACCENT = { light: '#ff6a00', dark: '#ffb066' } as const;

const LEVELS: Array<[HeadingLevel, string, string]> = [
  ['band', '36px', '48px'],
  ['heading', '24px', '30px'],
  ['value', '20px', '30px'],
];

const title = (tone: 'default' | 'accent' = 'default') => (
  <Heading tone={tone}>
    Entregas da <Heading.Mark>semana</Heading.Mark>
  </Heading>
);

// A violation of the Figma itself, pinned with it.fails below: the orange (heading/accent → colors/accent/default,
// flare-700) is 2.9:1 on white, under the 3:1 of a large title. On light, the accent tone and the mark of a
// default Heading are for dark backgrounds and the brand plate only, as the spec's "Não faça" says.
const KNOWN_LIGHT_ORANGE = (mode: string) => (mode === 'light' ? ['.rds-heading__mark'] : []);

describe.each(MODES)('Heading (%s)', (mode) => {
  it('is an h2 by default, in heading/default, and passes axe', async () => {
    const el = await render(<Heading>Entregas da semana</Heading>, mode);
    const h = el.querySelector('h2')!;
    expect(h.className).toContain('rds-heading--heading');
    expect(getComputedStyle(h).color).toBe(rgb(DEFAULT[mode]));
    expect(await axeViolations(el)).toEqual([]);
  });

  it('paints the mark in the other colour of the pair', async () => {
    const el = await render(<div>{title('default')}{title('accent')}</div>, mode);
    const [plain, accent] = el.querySelectorAll<HTMLElement>('.rds-heading');
    expect(getComputedStyle(plain).color).toBe(rgb(DEFAULT[mode]));
    expect(getComputedStyle(plain.querySelector('.rds-heading__mark')!).color).toBe(rgb(ACCENT[mode]));
    expect(getComputedStyle(accent).color).toBe(rgb(ACCENT[mode]));
    expect(getComputedStyle(accent.querySelector('.rds-heading__mark')!).color).toBe(rgb(DEFAULT[mode]));
  });

  it('a default Heading with a mark passes axe (the orange mark aside on light)', async () => {
    const el = await render(title('default'), mode);
    expect(await axeViolations(el, KNOWN_LIGHT_ORANGE(mode))).toEqual([]);
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
  it('tone=accent passes axe on dark (flare-300 on zinc-900)', async () => {
    const el = await render(title('accent'), 'dark');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('both tones pass axe on the brand plate (white and flare-300 on navy-900)', async () => {
    const el = await render(
      <div className="ds-plate" style={{ background: 'var(--surface-page)', padding: 16 }}>
        {title('default')}
        {title('accent')}
      </div>,
      'light',
    );
    const [plain] = el.querySelectorAll<HTMLElement>('.rds-heading');
    expect(getComputedStyle(plain).color).toBe(rgb('#ffffff'));
    expect(await axeViolations(el)).toEqual([]);
  });

  it.fails('the orange on white passes axe (tone=accent, or the mark, on the rojao light theme: 2.9:1)', async () => {
    const el = await render(<div>{title('default')}{title('accent')}</div>, 'light');
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
});
