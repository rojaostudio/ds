import { afterEach, describe, expect, it } from 'vitest';
import type { CSSProperties } from 'react';
import { Tile, type TileSize, type TileTone, type TileVariant } from './tile';
import { InfoIcon } from './internal/icons';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

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
