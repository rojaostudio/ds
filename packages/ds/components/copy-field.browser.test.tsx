import { afterEach, describe, expect, it, vi } from 'vitest';
import { CopyField } from './copy-field';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// The neutral outline Button's label is text/heading, flare-700 on the rojao light theme (2.9:1): a violation of the
// Figma itself, pinned with it.fails in button.browser.test.tsx.
const KNOWN_LIGHT = (mode: string) => (mode === 'light' ? ['.rds-button--neutral'] : []);

function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({ writeText } as unknown as Clipboard);
  return writeText;
}

describe.each(MODES)('CopyField (%s)', (mode) => {
  it('at rest and full width pass axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8, width: 320 }}>
        <CopyField value="00020126" />
        <CopyField value="00020126" label="Copiar código Pix" fullWidth />
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT(mode))).toEqual([]);
  });
});

describe('CopyField behaviour', () => {
  it('is an outline neutral Button that copies the value and says Copiado! on screen and to screen readers', async () => {
    const writeText = stubClipboard();
    const el = await render(<CopyField value="pix-123" />);
    const button = el.querySelector('button')!;
    expect(button.className).toContain('rds-button--outline');
    expect(button.textContent).toBe('Copiar');
    button.click();
    await vi.waitFor(() => expect(button.textContent).toBe('Copiado!'));
    expect(writeText).toHaveBeenCalledWith('pix-123');
    await vi.waitFor(() => expect(document.querySelector('[data-rds-announcer]')!.textContent).toBe('Copiado!'));
  });

  it('without a clipboard it stays as it was', async () => {
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({
      writeText: vi.fn().mockRejectedValue(new Error('denied')),
    } as unknown as Clipboard);
    const el = await render(<CopyField value="x" />);
    const button = el.querySelector('button')!;
    button.click();
    await new Promise((r) => setTimeout(r, 50));
    expect(button.textContent).toBe('Copiar');
  });

  it('fullWidth takes the container width', async () => {
    const el = await render(
      <div style={{ width: 300 }}>
        <CopyField value="x" fullWidth />
      </div>,
    );
    expect(el.querySelector('button')!.getBoundingClientRect().width).toBe(300);
  });
});
