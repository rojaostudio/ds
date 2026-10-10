import { afterEach, describe, expect, it } from 'vitest';
import type { CSSProperties } from 'react';
import { Tile, type TileSize, type TileTone, type TileVariant } from './tile';
import { InfoIcon } from './internal/icons';
import { MODES, axeViolations, cleanup, render, renderIn, setMedia } from './__tests__/render';

afterEach(async () => {
  await setMedia(null);
  cleanup();
});

const TONES: TileTone[] = ['action', 'neutral', 'info', 'success', 'warning', 'danger'];
const VARIANTS: TileVariant[] = ['fill', 'soft'];
const SIZES: TileSize[] = ['sm', 'md', 'lg'];

describe.each(MODES)('Tile (%s)', (mode) => {
  it('every tone, variant and size passes axe and is decorative', async () => {
    const el = await render(
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {TONES.flatMap((tone) =>
          VARIANTS.flatMap((variant) =>
            SIZES.map((size) => <Tile key={`${tone}-${variant}-${size}`} icon={<InfoIcon />} tone={tone} variant={variant} size={size} />),
          ),
        )}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
    const tiles = el.querySelectorAll('.rds-tile');
    expect(tiles).toHaveLength(36);
    tiles.forEach((t) => expect(t.getAttribute('aria-hidden')).toBe('true'));
  });

  it('measures 32, 48 and 64', async () => {
    const el = await render(
      <div>
        {SIZES.map((size) => (
          <Tile key={size} icon={<InfoIcon />} size={size} />
        ))}
      </div>,
      mode,
    );
    const widths = [...el.querySelectorAll<HTMLElement>('.rds-tile')].map((t) => t.getBoundingClientRect().width);
    expect(widths).toEqual([32, 48, 64]);
  });

  it('the corners follow the brand control radius (radius/control, 8 on the rojao theme), not a circle', async () => {
    const el = await render(
      <div>
        {SIZES.map((size) => (
          <Tile key={size} icon={<InfoIcon />} size={size} />
        ))}
      </div>,
      mode,
    );
    const control = getComputedStyle(document.documentElement).getPropertyValue('--radius-control').trim();
    expect(control).toBe('8px');
    for (const tile of el.querySelectorAll<HTMLElement>('.rds-tile')) expect(getComputedStyle(tile).borderTopLeftRadius).toBe(control);
  });
});

describe('Tile radius', () => {
  it('a brand scope with another control radius repaints the corners', async () => {
    const el = await render(
      <div data-rds-scope="" style={{ '--radius-control': '2px' } as CSSProperties}>
        <Tile icon={<InfoIcon />} />
      </div>,
    );
    expect(getComputedStyle(el.querySelector('.rds-tile')!).borderTopLeftRadius).toBe('2px');
  });
});

// tone=success variant=fill: the strong green (colors/state/success-strong) under its own icon colour
// (text/on/success-strong: white in light and print, black in dark and on the plate), 3:1 or more (WCAG 1.4.11).
const lum = (c: string) => {
  const [r, g, b] = c.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number);
  const ch = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe.each(['light', 'dark', 'plate', 'print'] as const)('Tile success fill (%s)', (mode) => {
  it('reads colors/state/success-strong and text/on/success-strong, icon 3:1 or more on the fill', async () => {
    if (mode === 'print') await setMedia('print');
    const el = await renderIn(<Tile icon={<InfoIcon />} tone="success" variant="fill" />, mode === 'print' ? 'light' : mode);
    const tile = el.querySelector<HTMLElement>('.rds-tile')!;
    const probe = document.createElement('span');
    tile.parentElement!.append(probe);
    const resolve = (v: string) => {
      probe.style.color = `var(${v})`;
      return getComputedStyle(probe).color;
    };
    const s = getComputedStyle(tile);
    expect(s.backgroundColor).toBe(resolve('--colors-state-success-strong'));
    expect(s.color).toBe(resolve('--text-on-success-strong'));
    expect(s.color).toBe(mode === 'dark' || mode === 'plate' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)');
    expect(ratio(s.color, s.backgroundColor)).toBeGreaterThanOrEqual(3);
  });
});
