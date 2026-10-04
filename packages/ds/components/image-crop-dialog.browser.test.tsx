import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ImageCropDialog } from './image-crop-dialog';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

// The dialog is portalled out of <main>: the landmark rule does not apply to it. The pressed Toggle on the rojao dark
// theme is a violation of the Figma, pinned in toggle.browser.test.tsx.
const KNOWN = (mode: string) => (mode === 'light' ? [] : ['.rds-image-crop__presets [data-state="on"]']);
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

describe.each(MODES)('ImageCropDialog (%s)', (mode) => {
  it('open, with the image loaded, passes axe', async () => {
    const file = await photo();
    await render(<ImageCropDialog open file={file} position="Foto 1 de 3" onCancel={() => {}} onConfirm={() => {}} />, mode);
    await settle();
    await loaded();
    expect(outsideRegion(await axeViolations(document.body, KNOWN(mode)))).toEqual([]);
  });
});

describe('ImageCropDialog behaviour', () => {
  it('a Dialog with the presets as a ToggleGroup: 1:1 first; choosing another presses it', async () => {
    const file = await photo();
    await render(<ImageCropDialog open file={file} position="Foto 1 de 3" onCancel={() => {}} onConfirm={() => {}} />);
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

  it('the presets carry the [RDS] icons; the ready state says how to adjust the crop', async () => {
    const file = await photo();
    await render(<ImageCropDialog open file={file} onCancel={() => {}} onConfirm={() => {}} />);
    await settle();
    await loaded();
    const items = [...dialog().querySelectorAll<HTMLButtonElement>('[aria-label="Proporção"] button')];
    for (const item of items) expect(item.querySelector('svg')).not.toBeNull();
    // square, rectangle-vertical, rectangle-horizontal (one rect each) and square-dashed (a path).
    expect(items.slice(0, 3).map((i) => i.querySelector('rect')!.getAttribute('width'))).toEqual(['18', '12', '20']);
    expect(items[3].querySelector('path')).not.toBeNull();
    expect(dialog().querySelector('.rds-image-crop__hint')!.textContent).toBe('Arraste as alças para ajustar o recorte.');
  });

  it('the stage, the shade, the crop line and the handles read the image-crop-dialog tokens', async () => {
    const file = await photo();
    await render(<ImageCropDialog open file={file} onCancel={() => {}} onConfirm={() => {}} />);
    await settle();
    await loaded();
    const resolve = (token: string) => {
      const probe = document.createElement('div');
      probe.style.color = `var(${token})`;
      dialog().appendChild(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    };
    const stage = dialog().querySelector<HTMLElement>('.rds-image-crop__stage')!;
    expect(getComputedStyle(stage).height).toBe('320px');
    expect(getComputedStyle(stage).backgroundColor).toBe(resolve('--image-crop-dialog-stage-background'));
    expect(resolve('--image-crop-dialog-stage-background')).toBe(resolve('--surface-muted'));
    const shade = dialog().querySelector<SVGRectElement>('.ReactCrop__crop-mask > rect')!;
    expect(getComputedStyle(shade).fill).toBe(resolve('--image-crop-dialog-shade'));
    expect(resolve('--image-crop-dialog-shade')).toBe(resolve('--surface-scrim'));
    const selection = dialog().querySelector<HTMLElement>('.ReactCrop__crop-selection')!;
    expect(getComputedStyle(selection).borderTopColor).toBe(resolve('--image-crop-dialog-selection'));
    expect(getComputedStyle(selection).backgroundImage).toBe('none');
    const handle = dialog().querySelector<HTMLElement>('.ReactCrop__drag-handle')!;
    expect(getComputedStyle(handle).backgroundColor).toBe(resolve('--image-crop-dialog-handle'));
    expect(resolve('--image-crop-dialog-handle')).toBe(resolve('--text-on-cover'));
  });

  it('a single preset shows no bar', async () => {
    const file = await photo();
    await render(
      <ImageCropDialog open file={file} presets={[{ id: 'banner', label: 'Banner', aspect: 3 }]} onCancel={() => {}} onConfirm={() => {}} />,
    );
    await settle();
    expect(dialog().querySelector('[aria-label="Proporção"]')).toBeNull();
  });

  it('Aplicar hands over the crop as a Blob and waits for it; Cancelar cancels', async () => {
    const file = await photo();
    let finish!: () => void;
    const onConfirm = vi.fn((_blob: Blob) => new Promise<void>((resolve) => (finish = resolve)));
    const onCancel = vi.fn();
    await render(<ImageCropDialog open file={file} onCancel={onCancel} onConfirm={onConfirm} />);
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

