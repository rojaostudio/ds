import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ImageCropModal } from './image-crop-modal';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

// The Dialog's title and the neutral ghost Cancelar are text/heading, flare-700 on the rojao light theme: pinned with
// it.fails in dialog.browser.test.tsx. The dialog is portalled out of <main>: the landmark rule does not apply to it.
// The pressed Toggle on the rojao dark theme is the same kind of finding, pinned in toggle.browser.test.tsx.
const KNOWN = (mode: string) =>
  mode === 'light' ? ['.rds-dialog__title', '.rds-dialog .rds-button--neutral'] : ['.rds-image-crop__presets [data-state="on"]'];
const outsideRegion = (lines: string[]) => lines.filter((line) => !line.startsWith('region:'));

async function photo(width = 320, height = 200): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#3366cc';
  ctx.fillRect(0, 0, width, height);
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  return new File([blob], 'foto.png', { type: 'image/png' });
}

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
const loaded = () => vi.waitFor(() => expect(dialog().querySelector('.rds-image-crop__layer')).toBeNull());

describe.each(MODES)('ImageCropModal (%s)', (mode) => {
  it('open, with the image loaded, passes axe', async () => {
    const file = await photo();
    await render(<ImageCropModal open file={file} position="Foto 1 de 3" onCancel={() => {}} onConfirm={() => {}} />, mode);
    await settle();
    await loaded();
    expect(outsideRegion(await axeViolations(document.body, KNOWN(mode)))).toEqual([]);
  });
});

describe('ImageCropModal behaviour', () => {
  it('a Dialog with the presets as a ToggleGroup: 1:1 first; choosing another presses it', async () => {
    const file = await photo();
    await render(<ImageCropModal open file={file} position="Foto 1 de 3" onCancel={() => {}} onConfirm={() => {}} />);
    await settle();
    expect(dialog().querySelector('.rds-dialog__title')!.textContent).toBe('Ajustar foto · Foto 1 de 3');
    const group = dialog().querySelector('[aria-label="Proporção"]')!;
    const items = [...group.querySelectorAll<HTMLButtonElement>('button')];
    expect(items.map((i) => i.textContent)).toEqual(['1:1', '4:5', '16:9', 'Livre']);
    expect(items[0].dataset.state).toBe('on');
    await userEvent.click(items[3]);
    expect(items[3].dataset.state).toBe('on');
    expect(items[0].dataset.state).toBe('off');
    expect(dialog().querySelector('.rds-image-crop__hint')!.textContent).toContain('Livre');
  });

  it('a single preset shows no bar', async () => {
    const file = await photo();
    await render(
      <ImageCropModal open file={file} presets={[{ id: 'banner', label: 'Banner', aspect: 3 }]} onCancel={() => {}} onConfirm={() => {}} />,
    );
    await settle();
    expect(dialog().querySelector('[aria-label="Proporção"]')).toBeNull();
  });

  it('Aplicar hands over the crop as a Blob and waits for it; Cancelar cancels', async () => {
    const file = await photo();
    let finish!: () => void;
    const onConfirm = vi.fn((_blob: Blob) => new Promise<void>((resolve) => (finish = resolve)));
    const onCancel = vi.fn();
    await render(<ImageCropModal open file={file} onCancel={onCancel} onConfirm={onConfirm} />);
    await settle();
    await loaded();
    const buttons = () => [...dialog().querySelectorAll<HTMLButtonElement>('.rds-dialog__footer .rds-button, footer .rds-button')];
    const apply = buttons().find((b) => b.textContent?.includes('Aplicar'))!;
    await userEvent.click(apply);
    await vi.waitFor(() => expect(onConfirm).toHaveBeenCalledOnce());
    expect(onConfirm.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(dialog().querySelector('.rds-image-crop__layer--busy')).not.toBeNull();
    finish();
    await vi.waitFor(() => expect(dialog().querySelector('.rds-image-crop__layer--busy')).toBeNull());
    await userEvent.click(buttons().find((b) => b.textContent === 'Cancelar')!);
    expect(onCancel).toHaveBeenCalled();
  });
});
