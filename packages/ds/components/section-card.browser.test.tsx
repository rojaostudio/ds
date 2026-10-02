import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { userEvent } from 'vitest/browser';
import { SectionCard } from './section-card';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('SectionCard (%s)', (mode) => {
  it('closed and open, with the badge, pass axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
        <SectionCard label="Dados do produto" badge="3 campos">
          <p>Campos</p>
        </SectionCard>
        <SectionCard label="Preço" badge="preenchido" defaultOpen>
          <p>O conteúdo da seção entra aqui.</p>
        </SectionCard>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('SectionCard behaviour', () => {
  it('is a heading with a disclosure button; Enter opens it and the content shows', async () => {
    const onToggle = vi.fn();
    const el = await render(
      <SectionCard label="Dados do produto" onToggle={onToggle}>
        <p>Campos</p>
      </SectionCard>,
    );
    const button = el.querySelector<HTMLButtonElement>('h3 > button')!;
    const content = document.getElementById(button.getAttribute('aria-controls')!)!;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(content.hidden).toBe(true);
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(content.hidden).toBe(false);
    expect(onToggle).toHaveBeenLastCalledWith(true);
  });

  it('controlled: it follows `open`', async () => {
    const onToggle = vi.fn();
    const el = await render(
      <SectionCard label="Preço" open={false} onToggle={onToggle}>
        <p>Campos</p>
      </SectionCard>,
    );
    const button = el.querySelector('button')!;
    await act(async () => button.click());
    expect(onToggle).toHaveBeenCalledWith(true);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});
