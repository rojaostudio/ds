import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { cdp, userEvent } from 'vitest/browser';
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

describe('ToggleGroup size', () => {
  const touch = (enabled: boolean) => cdp().send('Emulation.setTouchEmulationEnabled', { enabled, maxTouchPoints: 1 });
  afterEach(async () => {
    await touch(false);
  });

  const Icon = () => (
    <svg viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
  // Four icon-only items in a box that fits three per row: neighbours side by side and a second row below.
  const group = (
    <div style={{ width: 120, padding: 24 }}>
      <ToggleGroup type="multiple" size="sm" aria-label="Estilo do texto">
        {['Negrito', 'Itálico', 'Sublinhado', 'Tachado'].map((name) => (
          <ToggleGroupItem key={name} value={name} icon={<Icon />} aria-label={name} />
        ))}
      </ToggleGroup>
    </div>
  );

  it('passes the size to its items: 32 tall, a 32 square with only the icon, 4 apart with a fine pointer', async () => {
    const el = await render(
      <ToggleGroup type="single" size="sm" aria-label="Vista">
        <ToggleGroupItem value="lista" icon={<Icon />} aria-label="Lista" />
        <ToggleGroupItem value="grade">Grade</ToggleGroupItem>
      </ToggleGroup>,
    );
    const [icon, text] = Array.from(el.querySelectorAll('button'));
    const i = icon!.getBoundingClientRect();
    expect([i.width, i.height]).toEqual([32, 32]);
    expect(text!.getBoundingClientRect().height).toBe(32);
    expect(text!.getBoundingClientRect().left - i.right).toBe(4);
    expect(await axeViolations(el)).toEqual([]);
  });

  it('md (default) stays 44', async () => {
    const el = await render(
      <ToggleGroup type="single" aria-label="Vista">
        <ToggleGroupItem value="lista">Lista</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(el.querySelector('button')!.getBoundingClientRect().height).toBe(44);
  });

  it('with a coarse pointer, the touch layers of neighbours (side by side and between rows) do not overlap', async () => {
    await touch(true);
    const el = await render(group);
    expect(matchMedia('(pointer: coarse)').matches).toBe(true);
    const items = Array.from(el.querySelectorAll('button'));
    const rects = items.map((b) => b.getBoundingClientRect());
    // Side by side: each one keeps its own 6px beyond its edge; the gap holds both layers. The hit test is probed
    // 5px out (elementFromPoint rounds a half pixel onto the seam, where the later item is on top).
    const [a, b] = [rects[0]!, rects[1]!];
    expect(b.top).toBe(a.top);
    expect(b.left - a.right).toBeGreaterThanOrEqual(12);
    const y = a.top + a.height / 2;
    expect(document.elementFromPoint(a.right + 5, y)).toBe(items[0]);
    expect(document.elementFromPoint(b.left - 5, y)).toBe(items[1]);
    // Between rows: the fourth item starts a new row; the layers above and below meet without overlapping.
    const below = rects[3]!;
    expect(below.top).toBeGreaterThan(a.bottom);
    expect(below.top - a.bottom).toBeGreaterThanOrEqual(12);
    const x = a.left + a.width / 2;
    expect(document.elementFromPoint(x, a.bottom + 5)).toBe(items[0]);
    expect(document.elementFromPoint(x, below.top - 5)).toBe(items[3]);
    // Every item still reaches 44 x 44.
    for (const [i, r] of rects.entries()) {
      expect(document.elementFromPoint(r.left - 5, r.top + r.height / 2)).toBe(items[i]);
      expect(document.elementFromPoint(r.right + 5, r.top + r.height / 2)).toBe(items[i]);
      expect(document.elementFromPoint(r.left + r.width / 2, r.top - 5)).toBe(items[i]);
      expect(document.elementFromPoint(r.left + r.width / 2, r.bottom + 5)).toBe(items[i]);
    }
  });
});
