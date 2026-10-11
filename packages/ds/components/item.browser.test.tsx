import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Avatar } from './avatar';
import { Button } from './button';
import { Item, ItemGroup, type ItemSize, type ItemVariant } from './item';
import { InfoIcon } from './internal/icons';
import { Status } from './status';
import { Tile } from './tile';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const VARIANTS: ItemVariant[] = ['ghost', 'outline', 'soft'];
const SIZES: ItemSize[] = ['md', 'sm'];

describe.each(MODES)('Item (%s)', (mode) => {
  it('every variant × size, with media, description and action, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
        {VARIANTS.flatMap((variant) =>
          SIZES.map((size) => (
            <ItemGroup key={`${variant}-${size}`} aria-label={`${variant} ${size}`}>
              <Item
                variant={variant}
                size={size}
                media={<Tile icon={<InfoIcon />} variant="soft" />}
                title="Pedido #4821"
                description="3 itens · Entregue"
                trailing={<Status tone="warning" size="sm">Revisar</Status>}
                action={<Button variant="ghost">Ver pedido</Button>}
              />
              <Item variant={variant} size={size} media={<Avatar name="Ana Lima" />} title="Ana Lima" />
            </ItemGroup>
          )),
        )}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('a dense row list with a pressed row, values and a selected row in every variant passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
        {SIZES.map((size) => (
          <ItemGroup key={size} aria-label={`Clientes ${size}`}>
            {['Ana Lima', 'Bruno Souza', 'Carla Dias'].map((name, i) => (
              <Item
                key={name}
                variant="row"
                size={size}
                media={<Avatar name={name} />}
                title={name}
                description="Última compra há 3 dias · 12 pedidos no ano"
                trailing="R$ 1.240,00"
                selected={i === 1}
                onSelect={() => {}}
              />
            ))}
          </ItemGroup>
        ))}
        {(['ghost', 'outline', 'soft'] as const).map((variant) => (
          <Item key={variant} variant={variant} selected title={`Selecionado ${variant}`} description="Com a faixa" />
        ))}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Item row and selection', () => {
  it('row: no corners, only the line below; 12 16 in md and 8 16 in sm; media in 48 and 32', async () => {
    const el = await render(
      <ItemGroup style={{ width: 320 }}>
        <Item variant="row" media={<Tile icon={<InfoIcon />} />} title="Médio" />
        <Item variant="row" size="sm" media={<Tile size="sm" icon={<InfoIcon />} />} title="Pequeno" />
      </ItemGroup>,
    );
    const [md, sm] = [...el.querySelectorAll<HTMLElement>('.rds-item')].map((r) => getComputedStyle(r));
    expect([md.borderTopWidth, md.borderBottomWidth, md.borderTopLeftRadius]).toEqual(['0px', '1px', '0px']);
    expect([md.paddingTop, md.paddingLeft, md.paddingRight]).toEqual(['12px', '16px', '16px']);
    expect([sm.paddingTop, sm.paddingLeft]).toEqual(['8px', '16px']);
    const [mdMedia, smMedia] = [...el.querySelectorAll<HTMLElement>('.rds-item__media')].map((m) => m.getBoundingClientRect());
    expect([mdMedia.width, mdMedia.height, smMedia.width, smMedia.height]).toEqual([48, 48, 32, 32]);
    expect(getComputedStyle(el.querySelector('.rds-item-group')!).rowGap).toBe('0px');
  });

  it('row: the last row of a group has no line, at the same height; showDivider off drops it alone too (ds#87)', async () => {
    const el = await render(
      <div style={{ width: 320 }}>
        <ItemGroup>
          <Item variant="row" title="Primeiro" />
          <Item variant="row" title="Último" />
        </ItemGroup>
        <Item variant="row" title="Sozinho" showDivider={false} />
      </div>,
    );
    const [first, last, alone] = [...el.querySelectorAll<HTMLElement>('.rds-item')];
    expect(getComputedStyle(first).borderBottomWidth).toBe('1px');
    expect(getComputedStyle(last).borderBottomWidth).toBe('0px');
    expect(getComputedStyle(alone).borderBottomWidth).toBe('0px');
    expect(last.getBoundingClientRect().height).toBe(first.getBoundingClientRect().height);
  });

  it('row: title and description stay on one line each, with an ellipsis', async () => {
    const long = 'Um nome de cliente muito comprido que não cabe na largura do painel lateral';
    const el = await render(<Item variant="row" style={{ width: 240 }} title={long} description={long} trailing="R$ 9,00" />);
    for (const part of el.querySelectorAll<HTMLElement>('.rds-item__title, .rds-item__description')) {
      const style = getComputedStyle(part);
      expect([style.whiteSpace, style.textOverflow, style.overflow]).toEqual(['nowrap', 'ellipsis', 'hidden']);
      expect(part.scrollWidth).toBeGreaterThan(part.clientWidth);
      expect(part.getBoundingClientRect().height).toBeLessThanOrEqual(24);
    }
  });

  it('selected: item/selected/background and a 3px band in item/selected/indicator', async () => {
    const el = await render(<Item variant="row" selected title="Ana Lima" />);
    const style = getComputedStyle(el.querySelector('.rds-item')!);
    const probe = document.createElement('span');
    probe.style.color = 'var(--surface-tint-subtle)';
    el.append(probe);
    expect(style.backgroundColor).toBe(getComputedStyle(probe).color);
    probe.style.color = 'var(--text-action)';
    expect(style.boxShadow).toContain(getComputedStyle(probe).color);
    expect(style.boxShadow).toMatch(/3px 0px 0px/);
  });

  it('onSelect: one button named by the title, described by the description, aria-pressed; the whole row presses', async () => {
    const onSelect = vi.fn();
    const el = await render(
      <Item
        variant="row"
        title="Ana Lima"
        description="12 pedidos"
        selected={false}
        onSelect={onSelect}
        style={{ width: 360 }}
        action={<Button variant="ghost">Editar</Button>}
      />,
    );
    const press = el.querySelector<HTMLButtonElement>('.rds-item__press')!;
    expect(press.getAttribute('aria-pressed')).toBe('false');
    expect(document.getElementById(press.getAttribute('aria-describedby')!)?.textContent).toBe('12 pedidos');
    // A click on the row's empty start (not on the title) presses it: the button's hit area covers the row.
    const row = el.querySelector<HTMLElement>('.rds-item')!.getBoundingClientRect();
    (document.elementFromPoint(row.left + 4, row.bottom - 4) as HTMLElement).click();
    expect(onSelect).toHaveBeenCalledTimes(1);
    // The action stays its own control, above the stretched button.
    const action = el.querySelector<HTMLElement>('.rds-item__action button')!.getBoundingClientRect();
    expect(document.elementFromPoint(action.left + action.width / 2, action.top + action.height / 2)?.closest('.rds-item__action')).not.toBeNull();
  });

  it('keyboard: Tab reaches the row, the ring is drawn on the row, Enter and Space press it', async () => {
    const onSelect = vi.fn();
    const el = await render(
      <ItemGroup>
        <Item variant="row" title="Ana Lima" selected onSelect={onSelect} />
      </ItemGroup>,
    );
    await userEvent.keyboard('{Tab}');
    const press = el.querySelector<HTMLButtonElement>('.rds-item__press')!;
    expect(document.activeElement).toBe(press);
    expect(press.getAttribute('aria-pressed')).toBe('true');
    expect(getComputedStyle(el.querySelector('.rds-item')!).outlineStyle).toBe('solid');
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('without onSelect there is no button, and selected is only drawn', async () => {
    const el = await render(<Item selected title="Ana Lima" />);
    expect(el.querySelector('button')).toBeNull();
    expect(el.querySelector('.rds-item--selected')).not.toBeNull();
  });
});

describe('Item behaviour', () => {
  it('the title (item/title → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<Item title="Pedido #4821" />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('puts the trailing meta between the text and the action', async () => {
    const el = await render(
      <Item title="Tabela de preços" trailing={<Status tone="warning" size="sm">Revisar</Status>} action={<Button variant="ghost">Editar</Button>} />,
    );
    const parts = [...el.querySelector('.rds-item')!.children].map((c) => c.className);
    expect(parts).toEqual(['rds-item__content', 'rds-item__trailing', 'rds-item__action']);
  });

  it('is a <li> inside an ItemGroup and a <div> alone; ghost rows get a line between them', async () => {
    const el = await render(
      <div>
        <ItemGroup>
          <Item title="Um" />
          <Item title="Dois" />
        </ItemGroup>
        <Item title="Solto" />
      </div>,
    );
    const [one, two, loose] = el.querySelectorAll('.rds-item');
    expect(one.tagName).toBe('LI');
    expect(loose.tagName).toBe('DIV');
    expect(getComputedStyle(one).borderTopWidth).toBe('0px');
    expect(getComputedStyle(two).borderTopWidth).toBe('1px');
    expect(one.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  });

});

