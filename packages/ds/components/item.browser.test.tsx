import { afterEach, describe, expect, it } from 'vitest';
import { Avatar } from './avatar';
import { Button } from './button';
import { Item, ItemGroup, type ItemSize, type ItemVariant } from './item';
import { InfoIcon } from './internal/icons';
import { SettingRow } from './setting-row';
import { SettingsList } from './settings-list';
import { Switch } from './switch';
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
});

describe('Item behaviour', () => {
  it('the title (item/title → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<Item title="Pedido #4821" />, 'light');
    expect(await axeViolations(el)).toEqual([]);
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

  it('SettingRow (deprecated) is an Item: the label is tied to the control', async () => {
    const el = await render(
      <SettingsList title="Notificações">
        <SettingRow label="E-mail" description="Avisos de novos pedidos" htmlFor="email" control={<Switch id="email" />} />
      </SettingsList>,
    );
    expect(el.querySelector('.rds-item')).not.toBeNull();
    expect(el.querySelector('label[for="email"]')!.textContent).toBe('E-mail');
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Item vocabulary', () => {
  it('the deprecated variant default/muted and size="default" map to ghost, soft and md', async () => {
    const el = await render(
      <>
        <Item variant="default" size="default" title="a" />
        <Item variant="muted" title="b" />
      </>,
    );
    const [a, b] = [...el.querySelectorAll<HTMLElement>('.rds-item')].map((x) => x.className);
    expect(a).toContain('rds-item--ghost');
    expect(a).not.toContain('rds-item--sm');
    expect(b).toContain('rds-item--soft');
  });
});
