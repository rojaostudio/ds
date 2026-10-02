import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { userEvent } from 'vitest/browser';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('ToggleGroup (%s)', (mode) => {
  it('single and multiple, in both variants, pass axe', async () => {
    // Pressed in dark fails on the Figma tokens; pinned with it.fails in toggle.browser.test.tsx.
    const on = mode === 'dark' ? undefined : 'lista';
    const el = await render(
      <div style={{ display: 'grid', gap: 8 }}>
        <ToggleGroup type="single" aria-label="Vista" defaultValue={on}>
          <ToggleGroupItem value="lista">Lista</ToggleGroupItem>
          <ToggleGroupItem value="grade">Grade</ToggleGroupItem>
          <ToggleGroupItem value="mapa" disabled>Mapa</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="multiple" variant="ghost" aria-label="Estilo do texto" defaultValue={on ? ['b'] : []}>
          <ToggleGroupItem value="b">Negrito</ToggleGroupItem>
          <ToggleGroupItem value="i">Itálico</ToggleGroupItem>
        </ToggleGroup>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('ToggleGroup behaviour', () => {
  it('single: only one on at a time', async () => {
    const onValueChange = vi.fn();
    const el = await render(
      <ToggleGroup type="single" aria-label="Vista" defaultValue="lista" onValueChange={onValueChange}>
        <ToggleGroupItem value="lista">Lista</ToggleGroupItem>
        <ToggleGroupItem value="grade">Grade</ToggleGroupItem>
      </ToggleGroup>,
    );
    const [lista, grade] = el.querySelectorAll('button');
    expect(el.querySelector('[role="radiogroup"]')!.getAttribute('aria-label')).toBe('Vista');
    expect(lista.getAttribute('aria-checked')).toBe('true');
    await act(async () => grade.click());
    expect(onValueChange).toHaveBeenLastCalledWith('grade');
    expect(grade.getAttribute('data-state')).toBe('on');
    expect(lista.getAttribute('data-state')).toBe('off');
  });

  it('is one tab stop; the arrow keys move between items', async () => {
    const el = await render(
      <ToggleGroup type="multiple" aria-label="Estilo do texto">
        <ToggleGroupItem value="b">Negrito</ToggleGroupItem>
        <ToggleGroupItem value="i">Itálico</ToggleGroupItem>
      </ToggleGroup>,
    );
    const [b, i] = el.querySelectorAll('button');
    // Radix: multiple is a toolbar of toggle buttons; single is a radiogroup of radios.
    expect(el.querySelector('[role="toolbar"]')!.getAttribute('aria-label')).toBe('Estilo do texto');
    b.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(i);
    expect(i.tabIndex).toBe(0);
    expect(b.tabIndex).toBe(-1);
  });

  it('a disabled item stays focusable and does not toggle', async () => {
    const onValueChange = vi.fn();
    const el = await render(
      <ToggleGroup type="multiple" aria-label="Estilo do texto" onValueChange={onValueChange}>
        <ToggleGroupItem value="b" disabled>Negrito</ToggleGroupItem>
      </ToggleGroup>,
    );
    const b = el.querySelector('button')!;
    expect(b.getAttribute('aria-disabled')).toBe('true');
    await act(async () => b.click());
    expect(onValueChange).not.toHaveBeenCalled();
    expect(b.getAttribute('aria-pressed')).toBe('false');
  });
});
