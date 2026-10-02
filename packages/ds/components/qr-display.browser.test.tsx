import { afterEach, describe, expect, it } from 'vitest';
import { CopyField } from './copy-field';
import { QRDisplay } from './qr-display';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// A 1 × 1 white PNG: what is drawn does not matter here, only the frame around it.
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

// The neutral outline Button (the CopyField) on the rojao light theme: pinned with it.fails in button.browser.test.tsx.
const KNOWN_LIGHT = (mode: string) => (mode === 'light' ? ['.rds-button--neutral'] : []);

describe.each(MODES)('QRDisplay (%s)', (mode) => {
  it('with a CopyField and a caption passes axe', async () => {
    const el = await render(
      <QRDisplay src={PNG} alt="QR Code do Pix de R$ 50,00" size={160} caption="Abra o app do banco e escaneie.">
        <CopyField value="00020126" label="Copiar código" />
      </QRDisplay>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT(mode))).toEqual([]);
  });
});

describe('QRDisplay behaviour', () => {
  it('is a Card: the code at its size, 1:1, then the children, then the caption', async () => {
    const el = await render(<QRDisplay src={PNG} size={160} caption="Escaneie" />);
    expect(el.querySelector('.rds-card')).not.toBeNull();
    const img = el.querySelector('img')!;
    expect(img.alt).toBe('QR Code');
    const box = img.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([160, 160]);
    expect(el.querySelector('.rds-qr-display__caption')!.textContent).toBe('Escaneie');
  });

  it('never overflows a narrow container', async () => {
    const el = await render(
      <div style={{ width: 200 }}>
        <QRDisplay src={PNG} size={240} />
      </div>,
    );
    expect(el.querySelector('img')!.getBoundingClientRect().width).toBeLessThanOrEqual(200);
  });
});
