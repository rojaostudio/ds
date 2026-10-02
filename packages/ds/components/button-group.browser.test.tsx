import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './button';
import { ButtonGroup } from './button-group';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('ButtonGroup (%s)', (mode) => {
  it('is a named group and passes axe, in both orientations', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
        <ButtonGroup aria-label="Rascunho">
          <Button tone="action" variant="outline">Salvar</Button>
          <Button tone="action" variant="outline">Duplicar</Button>
          <Button tone="action" variant="outline">Arquivar</Button>
        </ButtonGroup>
        <ButtonGroup aria-label="Pedido" orientation="vertical">
          <Button tone="action" variant="outline">Editar</Button>
          <Button tone="action" variant="outline" disabled>Pausar</Button>
        </ButtonGroup>
      </div>,
      mode,
    );
    const group = el.querySelector('[role="group"]')!;
    expect(group.getAttribute('aria-label')).toBe('Rascunho');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('joins the buttons: inner corners square, borders overlapping by 1px', async () => {
    const el = await render(
      <ButtonGroup aria-label="Rascunho">
        <Button variant="outline">Um</Button>
        <Button variant="outline">Dois</Button>
      </ButtonGroup>,
      mode,
    );
    const [first, second] = el.querySelectorAll('button');
    expect(getComputedStyle(first).borderTopRightRadius).toBe('0px');
    expect(getComputedStyle(second).borderTopLeftRadius).toBe('0px');
    expect(second.getBoundingClientRect().left).toBe(first.getBoundingClientRect().right - 1);
  });
});

describe('ButtonGroup behaviour', () => {
  it('keeps every button in the tab order, disabled included', async () => {
    const el = await render(
      <ButtonGroup aria-label="Rascunho">
        <Button variant="outline">Um</Button>
        <Button variant="outline" disabled>Dois</Button>
      </ButtonGroup>,
    );
    for (const b of el.querySelectorAll('button')) expect(b.tabIndex).toBe(0);
  });
});
