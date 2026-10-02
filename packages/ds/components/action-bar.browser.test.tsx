import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionBar } from './action-bar';
import { Button } from './button';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('ActionBar (%s)', (mode) => {
  it('passes axe with inverse actions and the clear X on the bar', async () => {
    const el = await render(
      <ActionBar count="3 selecionados" onClear={() => {}}>
        <Button tone="inverse" variant="ghost">Arquivar</Button>
        <Button tone="inverse" variant="ghost">Excluir</Button>
        <Button tone="inverse" variant="ghost" disabled>Mover</Button>
      </ActionBar>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('ActionBar behaviour', () => {
  it('is a named region that announces the count', async () => {
    const el = await render(
      <ActionBar count="2 selecionados">
        <Button tone="inverse" variant="ghost">Arquivar</Button>
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
        <Button tone="inverse" variant="ghost">Arquivar</Button>
      </ActionBar>,
    );
    (el.querySelector('[aria-label="Limpar seleção"]') as HTMLButtonElement).click();
    expect(onClear).toHaveBeenCalledOnce();
  });
});
