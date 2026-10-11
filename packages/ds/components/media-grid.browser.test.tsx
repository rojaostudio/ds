import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { userEvent } from 'vitest/browser';
import { MediaGrid, type MediaGridItem } from './media-grid';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const PIXEL = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="%23888"/></svg>';
const PHOTOS: MediaGridItem[] = [
  { id: 'a', src: PIXEL, alt: 'Caneca branca' },
  { id: 'b', src: PIXEL },
  { id: 'c', src: PIXEL, alt: 'Caneca azul' },
];
const names = (el: HTMLElement) =>
  Array.from(el.querySelectorAll<HTMLElement>('.rds-media-grid__tile')).map((t) => t.getAttribute('aria-label'));
const tile = (el: HTMLElement, index: number) => el.querySelectorAll<HTMLElement>('.rds-media-grid__tile')[index];
const wait = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

function Photos(props: { onReorder?: (ids: string[]) => void; max?: number; onAdd?: (files: File[]) => void }) {
  const [items, setItems] = useState(PHOTOS);
  return (
    <div style={{ width: 400 }}>
      <MediaGrid
        label="Fotos"
        hint="Até 10 fotos. A primeira é a capa."
        items={items}
        max={props.max}
        onAdd={props.onAdd}
        onReorder={(ids) => {
          setItems(ids.map((id) => items.find((item) => item.id === id)!));
          props.onReorder?.(ids);
        }}
        onRemove={(id) => setItems(items.filter((item) => item.id !== id))}
        onEdit={() => {}}
      />
    </div>
  );
}

describe.each(MODES)('MediaGrid (%s)', (mode) => {
  it('passes axe: photos with the cover, uploading, error, the add tile, and empty', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 24, width: 400 }}>
        <Photos />
        <MediaGrid
          label="Fotos"
          items={[
            { id: 'a', src: PIXEL, alt: 'Caneca' },
            { id: 'b', src: PIXEL, status: 'uploading', progress: 40 },
            { id: 'c', src: PIXEL, status: 'error' },
          ]}
          onRetry={() => {}}
          onReorder={() => {}}
        />
        <MediaGrid label="Fotos" hint="Até 10 fotos." items={[]} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('MediaGrid behaviour', () => {
  it('square tiles that wrap, the first named as the cover, "Foto N" without alt, the add tile last', async () => {
    const el = await render(<Photos />);
    expect(names(el)).toEqual(['Caneca branca, capa', 'Foto 2', 'Caneca azul']);
    expect(el.querySelectorAll('.rds-media-grid__cover')).toHaveLength(1);
    const box = tile(el, 0).getBoundingClientRect();
    expect(Math.round(box.width)).toBe(Math.round(box.height));
    const items = el.querySelectorAll('.rds-media-grid__item');
    expect(items[items.length - 1].classList.contains('rds-media-grid__add-item')).toBe(true);
  });

  it('the menu sets the cover and moves without dragging (WCAG 2.5.7); one event, onReorder', async () => {
    const onReorder = vi.fn();
    const el = await render(<Photos onReorder={onReorder} />);
    const third = el.querySelectorAll<HTMLButtonElement>('.rds-media-grid__menu button')[2];
    expect(third.getAttribute('aria-label')).toBe('Ações de Caneca azul');
    await userEvent.click(third);
    await userEvent.click(document.querySelector<HTMLElement>('[role="menuitem"]')!);
    expect(onReorder).toHaveBeenLastCalledWith(['c', 'a', 'b']);
    await wait();
    await userEvent.click(el.querySelectorAll<HTMLButtonElement>('.rds-media-grid__menu button')[0]);
    const items = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).map((i) => i.textContent);
    // The cover has no "Definir como capa" nor "Mover para a esquerda".
    expect(items).toEqual(['Mover para a direita', 'Editar', 'Remover']);
    await userEvent.click(Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'))[0]);
    expect(onReorder).toHaveBeenLastCalledWith(['a', 'c', 'b']);
  });

  it('keyboard: Space picks up a photo, the arrows move it, Space drops', async () => {
    const onReorder = vi.fn();
    const el = await render(<Photos onReorder={onReorder} />);
    tile(el, 0).focus();
    await userEvent.keyboard(' {ArrowRight} ');
    expect(onReorder).toHaveBeenLastCalledWith(['b', 'a', 'c']);
  });

  it('dragging a tile with the mouse moves it', async () => {
    const onReorder = vi.fn();
    const el = await render(<Photos onReorder={onReorder} />);
    const from = tile(el, 2).getBoundingClientRect();
    const to = tile(el, 0).getBoundingClientRect();
    const at = (type: string, x: number, y: number, target: EventTarget) =>
      target.dispatchEvent(
        new PointerEvent(type, { clientX: x, clientY: y, pointerId: 3, pointerType: 'mouse', button: 0, bubbles: true }),
      );
    at('pointerdown', from.left + 20, from.top + 20, tile(el, 2));
    at('pointermove', from.left + 10, from.top + 20, window);
    await wait();
    at('pointermove', to.left + 10, to.top + 20, window);
    await wait();
    at('pointerup', to.left + 10, to.top + 20, window);
    await wait();
    expect(onReorder).toHaveBeenLastCalledWith(['c', 'a', 'b']);
  });

  it('removing the cover makes the next one the cover', async () => {
    const el = await render(<Photos />);
    await userEvent.click(el.querySelectorAll<HTMLButtonElement>('.rds-media-grid__menu button')[0]);
    await userEvent.click(Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).at(-1)!);
    expect(names(el)).toEqual(['Foto 1, capa', 'Caneca azul']);
  });

  it('max: past it the extra files are left out and the message shows at once; at it the add tile goes', async () => {
    const onAdd = vi.fn();
    const el = await render(<Photos max={5} onAdd={onAdd} />);
    const input = el.querySelector<HTMLInputElement>('.rds-media-grid__input')!;
    const files = ['1', '2', '3'].map((n) => new File(['x'], `${n}.png`, { type: 'image/png' }));
    await userEvent.upload(input, files);
    expect(onAdd).toHaveBeenCalledWith([files[0], files[1]]);
    expect(el.querySelector('.rds-field__error-message')!.textContent).toBe('Cabem mais 2 fotos.');
    const atMax = await render(<MediaGrid label="Fotos" max={3} items={PHOTOS} />);
    expect(atMax.querySelector('.rds-media-grid__add')).toBeNull();
  });

  it('uploading shows the bar and no menu; error offers "Tentar de novo"', async () => {
    const onRetry = vi.fn();
    const el = await render(
      <MediaGrid
        label="Fotos"
        onRetry={onRetry}
        items={[
          { id: 'a', src: PIXEL, status: 'uploading', progress: 40 },
          { id: 'b', src: PIXEL, status: 'error' },
        ]}
      />,
    );
    expect(el.querySelector('[role="progressbar"]')!.getAttribute('aria-valuenow')).toBe('40');
    expect(el.querySelectorAll('.rds-media-grid__menu')).toHaveLength(0);
    await userEvent.click(el.querySelector<HTMLButtonElement>('[aria-label="Tentar de novo: Foto 2"]')!);
    expect(onRetry).toHaveBeenCalledWith('b');
  });

  it('empty: the dropzone takes the files', async () => {
    const onAdd = vi.fn();
    const el = await render(<MediaGrid label="Fotos" items={[]} onAdd={onAdd} />);
    const input = el.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.multiple).toBe(true);
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    await userEvent.upload(input, file);
    expect(onAdd).toHaveBeenCalledWith([file]);
  });
});
