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
