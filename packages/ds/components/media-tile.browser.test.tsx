import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { userEvent } from 'vitest/browser';
import { MediaTile } from './media-tile';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// A 1 × 1 PNG, so the image loads without the network.
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const LONG = 'Um nome de produto muito comprido que passa de duas linhas na miniatura da grade';

describe.each(MODES)('MediaTile (%s)', (mode) => {
  it('image and fallback, square and video, plain and link, pass axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 160px)', gap: 8 }}>
        <MediaTile src={PIXEL} alt="" label="Camiseta básica algodão" />
        <MediaTile label="Camiseta básica algodão" />
        <MediaTile aspect="video" src={PIXEL} alt="Camiseta azul" href="#produto" />
        <MediaTile aspect="video" label="Sem imagem" href="#produto" />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('sm in wrappers, plain and link, pass axe', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 8, width: 432 }}>
        <div style={{ flex: '1 1 72px', maxWidth: 100 }}>
          <MediaTile size="sm" src={PIXEL} alt="" label="Camiseta básica algodão" />
        </div>
        <div style={{ flex: '1 1 72px', maxWidth: 100 }}>
          <MediaTile size="sm" label="Sem imagem" href="#produto" />
        </div>
        <div style={{ flex: '1 1 72px', maxWidth: 100 }}>
          <MediaTile src={PIXEL} alt="Camiseta azul" href="#produto" />
        </div>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('MediaTile behaviour', () => {
  it('square is 1:1 and video 16:9; the label is 8 inside and cut at two lines', async () => {
    const el = await render(
      <div style={{ width: 160 }}>
        <MediaTile label={LONG} />
        <MediaTile aspect="video" />
      </div>,
    );
    const [square, video] = el.querySelectorAll<HTMLElement>('.rds-media-tile__media');
    expect(square.getBoundingClientRect().height).toBe(158);
    expect(Math.round(video.getBoundingClientRect().height)).toBe(Math.round((158 * 9) / 16));
    const label = el.querySelector<HTMLElement>('.rds-media-tile__label')!;
    expect(label.getBoundingClientRect().height).toBe(32);
    expect(getComputedStyle(label).marginTop).toBe('8px');
  });

  it('takes the width of its parent (140 and 200), the square tile with a square media', async () => {
    for (const width of [140, 200]) {
      cleanup();
      const el = await render(
        <div style={{ width }}>
          <MediaTile label={LONG} />
        </div>,
      );
      const tile = el.querySelector<HTMLElement>('.rds-media-tile')!;
      expect(tile.getBoundingClientRect().width).toBe(width);
      const media = el.querySelector<HTMLElement>('.rds-media-tile__media')!.getBoundingClientRect();
      expect(media.width).toBe(width - 2);
      expect(media.height).toBeCloseTo(media.width, 1);
    }
  });

  it('takes the parent width in a flex row too: no fixed width, no min or max', async () => {
    const el = await render(
      <div style={{ display: 'flex', width: 480 }}>
        <MediaTile size="sm" label="Foto" />
      </div>,
    );
    const style = getComputedStyle(el.querySelector<HTMLElement>('.rds-media-tile')!);
    expect(el.querySelector<HTMLElement>('.rds-media-tile')!.getBoundingClientRect().width).toBe(480);
    expect(style.maxWidth).toBe('none');
    expect(style.minWidth).toBe('0px');
  });

  it('sm and md have the same width; sm changes only the label (caption 12/16, one line with an ellipsis)', async () => {
    const el = await render(
      <div style={{ width: 160 }}>
        <MediaTile size="sm" label={LONG} />
        <MediaTile size="md" label={LONG} />
      </div>,
    );
    const [sm, md] = el.querySelectorAll<HTMLElement>('.rds-media-tile');
    expect(sm.getBoundingClientRect().width).toBe(160);
    expect(md.getBoundingClientRect().width).toBe(160);
    const [smMedia, mdMedia] = el.querySelectorAll<HTMLElement>('.rds-media-tile__media');
    expect(smMedia.getBoundingClientRect().height).toBe(mdMedia.getBoundingClientRect().height);
    const [smLabel, mdLabel] = el.querySelectorAll<HTMLElement>('.rds-media-tile__label');
    const style = getComputedStyle(smLabel);
    expect(style.fontSize).toBe('12px');
    expect(style.lineHeight).toBe('16px');
    expect(style.textOverflow).toBe('ellipsis');
    expect(style.whiteSpace).toBe('nowrap');
    expect(smLabel.getBoundingClientRect().height).toBe(16);
    expect(smLabel.scrollWidth).toBeGreaterThan(smLabel.clientWidth);
    expect(mdLabel.getBoundingClientRect().height).toBe(32);
  });

  it('a wrapper sets the width of a row of thumbnails (flex 1 1 72px, max-width 100px)', async () => {
    const tiles = (width: number) => (
      <div style={{ width, padding: 24, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['A', 'B', 'C', 'D'].map((n) => (
            <div key={n} style={{ flex: '1 1 72px', maxWidth: 100, minWidth: 0 }}>
              <MediaTile size="sm" label={`Foto ${n}`} />
            </div>
          ))}
        </div>
      </div>
    );
    for (const [width, expected] of [
      [480, 100],
      [360, (360 - 48 - 24) / 4],
    ] as const) {
      cleanup();
      const el = await render(tiles(width));
      for (const tile of el.querySelectorAll<HTMLElement>('.rds-media-tile')) {
        expect(tile.getBoundingClientRect().width).toBeCloseTo(expected, 0);
        const media = tile.querySelector<HTMLElement>('.rds-media-tile__media')!.getBoundingClientRect();
        expect(media.height).toBeCloseTo(media.width, 1);
      }
    }
  });

  it('when the image fails to load it shows the image-off icon', async () => {
    const el = await render(<MediaTile src="data:image/png;base64,quebrada" alt="Foto" />);
    await act(async () => {
      for (let i = 0; i < 50 && el.querySelector('img'); i++) await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.rds-media-tile__fallback svg')).not.toBeNull();
  });

  it('with href it is a link with a 2px outline on focus; without, a plain box', async () => {
    const el = await render(
      <div>
        <MediaTile label="Camiseta" href="#produto" />
        <MediaTile label="Camiseta" />
      </div>,
    );
    const link = el.querySelector<HTMLAnchorElement>('a.rds-media-tile')!;
    expect(link.getAttribute('href')).toBe('#produto');
    expect(link.textContent).toBe('Camiseta');
    expect(el.querySelectorAll('a')).toHaveLength(1);
    await userEvent.tab();
    expect(document.activeElement).toBe(link);
    expect(getComputedStyle(link).outlineWidth).toBe('2px');
    expect(getComputedStyle(link).outlineOffset).toBe('-2px');
  });
});
