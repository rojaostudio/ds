import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './button';
import { DangerZone, DangerZoneItem } from './danger-zone';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

function Example() {
  return (
    <DangerZone title="Zona de risco" description="Ações que não têm volta">
      <DangerZoneItem
        title="Despublicar a vitrine"
        description="Clientes deixam de ver a loja."
        action={
          <Button tone="danger" variant="outline">
            Despublicar
          </Button>
        }
      />
      <DangerZoneItem
        title="Excluir a conta"
        description="Apaga pedidos, clientes e produtos."
        action={
          <Button tone="danger" variant="outline">
            Excluir
          </Button>
        }
      />
    </DangerZone>
  );
}

describe.each(MODES)('DangerZone (%s)', (mode) => {
  it('passes axe', async () => {
    const el = await render(
      <div style={{ maxWidth: 560 }}>
        <Example />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('DangerZone behaviour', () => {
  it('a section named by its h2, a danger Tile, Items with a line between them', async () => {
    const el = await render(<Example />);
    const section = el.querySelector('section.rds-card')!;
    const h2 = section.querySelector('h2')!;
    expect(h2.textContent).toBe('Zona de risco');
    expect(section.getAttribute('aria-labelledby')).toBe(h2.id);
    expect(section.querySelector('.rds-tile--danger-soft')).not.toBeNull();
    const [first, second] = section.querySelectorAll<HTMLElement>('.rds-item');
    expect(getComputedStyle(first).borderTopWidth).toBe('0px');
    expect(getComputedStyle(second).borderTopWidth).toBe('1px');
  });

  it('without a title it is a plain div, with no dangling name', async () => {
    const el = await render(
      <DangerZone>
        <DangerZoneItem title="Excluir" />
      </DangerZone>,
    );
    const card = el.querySelector('.rds-card')!;
    expect(card.tagName).toBe('DIV');
    expect(card.hasAttribute('aria-labelledby')).toBe(false);
  });
});
