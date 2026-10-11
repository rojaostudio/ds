import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { Media, type MediaRatio } from './media';
import { MODES, axeViolations, cleanup, cssVar, render } from './__tests__/render';

afterEach(cleanup);

// A 1 × 1 PNG, so the image loads without the network.
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const BROKEN = 'data:image/png;base64,quebrada';
const RATIOS: [MediaRatio, number][] = [
  ['1:1', 1],
  ['4:3', 3 / 4],
  ['3:4', 4 / 3],
  ['16:9', 9 / 16],
  ['9:16', 16 / 9],
];

/** Waits until the broken image has fired onError and left the box. */
async function waitForFallback(el: HTMLElement) {
  await act(async () => {
    for (let i = 0; i < 50 && el.querySelector('img'); i++) await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

describe.each(MODES)('Media (%s)', (mode) => {
  it('image, fallback with alt, decorative and contain pass axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 120px)', gap: 8 }}>
        <Media src={PIXEL} alt="Camiseta azul" />
        <Media alt="Camiseta azul" />
        <Media decorative ratio="16:9" src={PIXEL} />
        <Media ratio="3:4" fit="contain" src={PIXEL} alt="Camiseta azul" />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Media behaviour', () => {
  it('the five ratios in parents of 72 and 600: 100% wide, the height by the ratio, the image not distorted', async () => {
    for (const width of [72, 600]) {
      cleanup();
      const el = await render(
        <div style={{ width }}>
          {RATIOS.map(([ratio]) => (
            <Media key={ratio} ratio={ratio} src={PIXEL} alt="Foto" />
          ))}
        </div>,
      );
      const boxes = [...el.querySelectorAll<HTMLElement>('.rds-media')];
      RATIOS.forEach(([, k], i) => {
        const box = boxes[i]!.getBoundingClientRect();
        expect(box.width).toBe(width);
        expect(box.height).toBeCloseTo(width * k, 0);
        const img = boxes[i]!.querySelector('img')!;
        const r = img.getBoundingClientRect();
        expect(r.width).toBeCloseTo(box.width, 0);
        expect(r.height).toBeCloseTo(box.height, 0);
        // The pixels keep their proportion: object-fit crops (cover) instead of stretching.
        expect(getComputedStyle(img).objectFit).toBe('cover');
      });
    }
  });

  it('fit="contain" shows the whole image', async () => {
    const el = await render(<Media ratio="16:9" fit="contain" src={PIXEL} alt="Foto" />);
    expect(getComputedStyle(el.querySelector('img')!).objectFit).toBe('contain');
  });

  it('rounded in media/radius with overflow hidden, on media/background', async () => {
    const el = await render(<Media alt="Foto" />);
    const style = getComputedStyle(el.querySelector<HTMLElement>('.rds-media')!);
    expect(style.borderTopLeftRadius).toBe(cssVar('--radius-card'));
    expect(style.overflow).toBe('hidden');
    const probe = document.createElement('div');
    probe.style.background = 'var(--surface-muted)';
    el.appendChild(probe);
    expect(style.backgroundColor).toBe(getComputedStyle(probe).backgroundColor);
  });

  it('a broken src falls back to the icon, centred; with alt the box is role="img" with that name', async () => {
    const el = await render(
      <div style={{ width: 200 }}>
        <Media src={BROKEN} alt="Camiseta azul" />
      </div>,
    );
    await waitForFallback(el);
    expect(el.querySelector('img')).toBeNull();
    const box = el.querySelector<HTMLElement>('.rds-media')!;
    expect(box.getAttribute('role')).toBe('img');
    expect(box.getAttribute('aria-label')).toBe('Camiseta azul');
    const icon = box.querySelector('.rds-media__fallback svg')!.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    expect(icon.left - b.left).toBeCloseTo(b.right - icon.right, 0);
    expect(icon.top - b.top).toBeCloseTo(b.bottom - icon.bottom, 0);
  });

  it('without src it shows the fallback; a custom fallback replaces the icon', async () => {
    const el = await render(
      <div>
        <Media alt="Sem foto" />
        <Media alt="Sem foto" fallback={<span className="mine">SF</span>} />
      </div>,
    );
    const [plain, custom] = el.querySelectorAll<HTMLElement>('.rds-media');
    expect(plain!.querySelector('.rds-media__fallback svg')).not.toBeNull();
    expect(custom!.querySelector('.mine')!.textContent).toBe('SF');
    expect(custom!.querySelector('svg')).toBeNull();
  });

  it('with an image and alt, the alt is on the image and the box has no role', async () => {
    const el = await render(<Media src={PIXEL} alt="Camiseta azul" />);
    expect(el.querySelector('img')!.getAttribute('alt')).toBe('Camiseta azul');
    expect(el.querySelector('.rds-media')!.hasAttribute('role')).toBe(false);
  });

  it('decorative: alt="" on the image and aria-hidden on the box, also in the fallback', async () => {
    const el = await render(
      <div>
        <Media decorative src={PIXEL} />
        <Media decorative />
      </div>,
    );
    const [image, empty] = el.querySelectorAll<HTMLElement>('.rds-media');
    expect(image!.querySelector('img')!.getAttribute('alt')).toBe('');
    expect(image!.getAttribute('aria-hidden')).toBe('true');
    expect(empty!.getAttribute('aria-hidden')).toBe('true');
    expect(empty!.hasAttribute('role')).toBe(false);
  });

  it('children take the place of src and fill the box', async () => {
    const el = await render(
      <div style={{ width: 300 }}>
        <Media ratio="16:9" alt="Foto" src={BROKEN}>
          <img src={PIXEL} alt="Foto própria" />
        </Media>
      </div>,
    );
    const imgs = el.querySelectorAll('img');
    expect(imgs).toHaveLength(1);
    expect(imgs[0]!.getAttribute('alt')).toBe('Foto própria');
    const r = imgs[0]!.getBoundingClientRect();
    expect(r.width).toBe(300);
    expect(r.height).toBeCloseTo((300 * 9) / 16, 0);
    expect(el.querySelector('.rds-media__fallback')).toBeNull();
  });

  it('the type asks for alt or decorative', () => {
    // @ts-expect-error: neither alt nor decorative
    void (<Media src={PIXEL} />);
    // @ts-expect-error: alt and decorative together
    void (<Media src={PIXEL} alt="Foto" decorative />);
    expect(true).toBe(true);
  });
});

describe('Media dimmed', () => {
  it('turns grey and fades by the token (0.5), and the fallback too', async () => {
    const el = await render(
      <div style={{ width: 120 }}>
        <Media alt="Camiseta" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" dimmed />
        <Media alt="Sem foto" dimmed />
      </div>,
    );
    const [a, b] = [...el.querySelectorAll<HTMLElement>('.rds-media')].map((n) => getComputedStyle(n));
    expect(a.filter).toBe('grayscale(1)');
    expect(a.opacity).toBe('0.5');
    expect(b.opacity).toBe('0.5');
  });

  it('is off by default', async () => {
    const el = await render(<Media alt="Camiseta" />);
    expect(getComputedStyle(el.querySelector('.rds-media')!).opacity).toBe('1');
  });
});
