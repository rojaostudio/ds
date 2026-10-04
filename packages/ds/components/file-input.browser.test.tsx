import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { userEvent } from 'vitest/browser';
import { FileInput, formatFileSize } from './file-input';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const pdf = () => new File(['conteúdo'], 'comprovante.pdf', { type: 'application/pdf' });
// A 1×1 PNG, so the tile has a real image to preview.
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const png = () => new File([Uint8Array.from(atob(PNG), (c) => c.charCodeAt(0))], 'logo.png', { type: 'image/png' });
const PNG_URL = `data:image/png;base64,${PNG}`;

/** Drags files over a box and drops them, as the browser does; says whether the box lit up while dragging. */
async function dropOn(box: Element, files: File[]) {
  const data = new DataTransfer();
  for (const file of files) data.items.add(file);
  await act(async () => {
    box.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }));
    box.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }));
  });
  const dragging = box.classList.contains('rds-file-input__area--dragging');
  await act(async () => {
    box.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }));
  });
  return dragging;
}

describe.each(MODES)('FileInput (%s)', (mode) => {
  it('every state passes axe: empty, filled, hint, error, required, disabled', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 320 }}>
        <FileInput label="Comprovante" />
        <FileInput label="Comprovante" fileName="arquivo.pdf" />
        <FileInput label="Comprovante" hint="PDF ou DOCX, até 5 MB." required />
        <FileInput label="Comprovante" fileName="foto.png" errorMessage="O arquivo passa de 5 MB." />
        <FileInput label="Comprovante" disabled />
        <FileInput label="Comprovante" disabled fileName="arquivo.pdf" />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('dropzone and tile pass axe in every state: empty, hint, error, required, disabled, filled', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 320 }}>
        <FileInput layout="dropzone" label="Comprovante" hint="PDF ou DOCX, até 5 MB." required />
        <FileInput layout="dropzone" label="Comprovante" hint="PDF ou DOCX, até 5 MB." errorMessage="O arquivo passa de 5 MB." />
        <FileInput layout="dropzone" label="Comprovante" hint="PDF ou DOCX, até 5 MB." disabled />
        <FileInput layout="dropzone" label="Comprovante" fileName="arquivo.pdf" fileSize="1,2 MB" />
        <FileInput layout="tile" label="Logo" tileText="Enviar logo" hint="PNG ou JPG, até 2 MB." />
        <FileInput layout="tile" label="Logo" tileText="Enviar logo" errorMessage="A imagem passa de 2 MB." />
        <FileInput layout="tile" label="Logo" tileText="Enviar logo" disabled />
        <FileInput layout="tile" label="Logo" preview={PNG_URL} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('is 44px tall, as the Input', async () => {
    const el = await render(<FileInput label="Comprovante" />, mode);
    expect(el.querySelector<HTMLElement>('.rds-field__box')!.getBoundingClientRect().height).toBe(44);
  });
});

describe('FileInput behaviour', () => {
  it('the top label on the rojao light theme passes axe', async () => {
    const el = await render(<FileInput label="Comprovante" />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('a native file input named by the label, described by the hint', async () => {
    const el = await render(<FileInput label="Comprovante" hint="PDF ou DOCX, até 5 MB." accept=".pdf,.docx" />);
    const input = el.querySelector('input')!;
    expect(input.type).toBe('file');
    expect(input.accept).toBe('.pdf,.docx');
    expect(input.labels?.[0]?.textContent).toBe('Comprovante');
    expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe('PDF ou DOCX, até 5 MB.');
    expect(el.textContent).toContain('Nenhum arquivo');
    expect(el.querySelector('[aria-label="Remover arquivo"]')).toBeNull();
  });

  it('clicking the box opens the chooser: the click lands on the native input', async () => {
    const el = await render(<FileInput label="Comprovante" />);
    const input = el.querySelector('input')!;
    const opened = vi.fn((event: Event) => event.preventDefault());
    input.addEventListener('click', opened);
    await userEvent.click(el.querySelector<HTMLElement>('.rds-file-input__choose')!, { force: true });
    expect(opened).toHaveBeenCalledOnce();
  });

  it('choosing shows the name; the × clears it, fires onClear and gives the focus back', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    const el = await render(<FileInput label="Comprovante" onChange={onChange} onClear={onClear} />);
    const input = el.querySelector('input')!;
    await userEvent.upload(input, pdf());
    await vi.waitFor(() => expect(el.textContent).toContain('comprovante.pdf'));
    expect(onChange).toHaveBeenCalledOnce();
    const clear = el.querySelector<HTMLButtonElement>('[aria-label="Remover arquivo"]')!;
    await act(async () => clear.click());
    expect(input.value).toBe('');
    expect(onClear).toHaveBeenCalledOnce();
    expect(el.textContent).toContain('Nenhum arquivo');
    expect(document.activeElement).toBe(input);
  });

  it('errorMessage turns on aria-invalid; disabled is the native one and hides the ×', async () => {
    const el = await render(
      <>
        <FileInput label="Comprovante" errorMessage="O arquivo passa de 5 MB." />
        <FileInput label="Comprovante" disabled fileName="arquivo.pdf" />
      </>,
    );
    const [wrong, off] = Array.from(el.querySelectorAll('input'));
    expect(wrong.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(wrong.getAttribute('aria-describedby')!)?.textContent).toBe('O arquivo passa de 5 MB.');
    expect(off.disabled).toBe(true);
    expect(el.querySelector('[aria-label="Remover arquivo"]')).toBeNull();
  });
});

describe('FileInput layouts', () => {
  it('formats the size the way a person reads it', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1258291)).toBe('1,2 MB');
    expect(formatFileSize(850 * 1024)).toBe('850 KB');
  });

  it('dropzone: the hint stays inside the area, named and described; choosing shows the name, the size and the ×', async () => {
    const onFiles = vi.fn();
    const el = await render(
      <FileInput layout="dropzone" label="Comprovante" hint="PDF ou DOCX, até 5 MB." errorMessage="O arquivo passa de 5 MB." onFiles={onFiles} />,
    );
    const input = el.querySelector('input')!;
    expect(input.labels?.[0]?.textContent).toBe('Comprovante');
    const described = input.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)?.textContent);
    expect(described).toEqual(['PDF ou DOCX, até 5 MB.', 'O arquivo passa de 5 MB.']);
    expect(el.querySelector('.rds-file-input__area')!.textContent).toContain('PDF ou DOCX, até 5 MB.');
    await userEvent.upload(input, pdf());
    await vi.waitFor(() => expect(el.textContent).toContain('comprovante.pdf'));
    expect(el.textContent).toContain(formatFileSize(pdf().size));
    expect(onFiles).toHaveBeenCalledOnce();
    const clear = el.querySelector<HTMLButtonElement>('[aria-label="Remover arquivo"]')!;
    await act(async () => clear.click());
    expect(el.textContent).toContain('Arraste o arquivo ou clique para escolher');
    expect(document.activeElement).toBe(input);
  });

  it('dropzone: a file dragged over lights the area; dropped, it goes into the native input', async () => {
    const onChange = vi.fn();
    const el = await render(<FileInput layout="dropzone" label="Comprovante" onChange={onChange} />);
    const box = el.querySelector('.rds-field__box')!;
    expect(await dropOn(box, [pdf()])).toBe(true);
    expect(box.classList.contains('rds-file-input__area--dragging')).toBe(false);
    const input = el.querySelector('input')!;
    expect(input.files?.[0]?.name).toBe('comprovante.pdf');
    expect(onChange).toHaveBeenCalledOnce();
    expect(el.textContent).toContain('comprovante.pdf');
  });

  it('dropzone: two files on a single input keep the first; disabled ignores the drop', async () => {
    const el = await render(
      <>
        <FileInput layout="dropzone" label="Comprovante" />
        <FileInput layout="dropzone" label="Anexo" disabled />
      </>,
    );
    const [one, off] = Array.from(el.querySelectorAll('.rds-field__box'));
    await dropOn(one, [pdf(), png()]);
    expect(el.querySelectorAll('input')[0].files).toHaveLength(1);
    expect(await dropOn(off, [pdf()])).toBe(false);
    expect(el.querySelectorAll('input')[1].files).toHaveLength(0);
  });

  it('tile: empty, the tile is the chooser; with an image, the preview with swap and remove', async () => {
    const onClear = vi.fn();
    const el = await render(<FileInput layout="tile" label="Logo" tileText="Enviar logo" onClear={onClear} />);
    const input = el.querySelector('input')!;
    expect(input.accept).toBe('image/*');
    expect(el.textContent).toContain('Enviar logo');
    await userEvent.upload(input, png());
    const img = await vi.waitFor(() => el.querySelector('img')!);
    expect(img.alt).toBe('Prévia de Logo');
    expect(img.src).toMatch(/^blob:/);
    // The input leaves the tab order: the swap button opens it.
    expect(input.tabIndex).toBe(-1);
    const opened = vi.fn((event: Event) => event.preventDefault());
    input.addEventListener('click', opened);
    el.querySelector<HTMLButtonElement>('[aria-label="Trocar imagem"]')!.click();
    expect(opened).toHaveBeenCalledOnce();
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Remover imagem"]')!.click());
    expect(onClear).toHaveBeenCalledOnce();
    expect(el.querySelector('img')).toBeNull();
    expect(input.tabIndex).toBe(0);
    expect(document.activeElement).toBe(input);
  });

  it('tile: `preview` controls the image (a saved one)', async () => {
    const el = await render(<FileInput layout="tile" label="Logo" preview={PNG_URL} previewAlt="Logo da loja" />);
    expect(el.querySelector('img')!.alt).toBe('Logo da loja');
    expect(el.querySelector('[aria-label="Trocar imagem"]')).not.toBeNull();
  });
});
