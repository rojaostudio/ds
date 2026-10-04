import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionBar } from './action-bar';
import { Button } from './button';
import { SCHEMES, axeViolations, cleanup, render, renderIn } from './__tests__/render';

afterEach(cleanup);

describe.each(SCHEMES)('ActionBar (%s)', (mode) => {
  it('passes axe with neutral ghost actions and the clear X on the bar', async () => {
    const el = await renderIn(
      <ActionBar count="3 selecionados" onClear={() => {}}>
        <Button tone="neutral" variant="ghost">Arquivar</Button>
        <Button tone="neutral" variant="ghost">Excluir</Button>
        <Button tone="neutral" variant="ghost" disabled>Mover</Button>
      </ActionBar>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  // Figma: the actions are neutral ghost Buttons with the label and icon in actionbar/text.
  it('the actions and the X are neutral ghost, in actionbar/text', async () => {
    const el = await renderIn(
      <ActionBar count="3 selecionados" onClear={() => {}}>
        <Button tone="neutral" variant="ghost">Arquivar</Button>
      </ActionBar>,
      mode,
    );
    const bar = el.querySelector('.rds-actionbar')!;
    const text = getComputedStyle(bar).color;
    for (const button of el.querySelectorAll('.rds-actionbar .rds-button')) {
      expect(button.className).toContain('rds-button--neutral');
      expect(button.className).toContain('rds-button--ghost');
      expect(getComputedStyle(button).color).toBe(text);
    }
    expect(el.querySelector('[class*="inverse"]')).toBeNull();
  });
});

describe('ActionBar behaviour', () => {
  it('is a named region that announces the count', async () => {
    const el = await render(
      <ActionBar count="2 selecionados">
        <Button tone="neutral" variant="ghost">Arquivar</Button>
      </ActionBar>,
    );
    const region = el.querySelector('[role="region"]')!;
    expect(region.getAttribute('aria-label')).toBe('Ações da seleção');
    expect(el.querySelector('[aria-live="polite"]')!.textContent).toBe('2 selecionados');
    // showClear off: no X.
    expect(el.querySelector('[aria-label="Limpar seleção"]')).toBeNull();
  });

  it('the X clears the selection', async () => {
    const onClear = vi.fn();
    const el = await render(
      <ActionBar count="2 selecionados" onClear={onClear}>
        <Button tone="neutral" variant="ghost">Arquivar</Button>
      </ActionBar>,
    );
    (el.querySelector('[aria-label="Limpar seleção"]') as HTMLButtonElement).click();
    expect(onClear).toHaveBeenCalledOnce();
  });
});
