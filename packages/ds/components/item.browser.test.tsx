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

// [RDS] maps item/title to text/heading, which on the rojao light theme is flare (#ff6a00, 2.9:1 on white): a violation of
// the Figma itself. Kept out of the light matrix and pinned with it.fails below, as in alert.browser.test.tsx.
const KNOWN_LIGHT_TITLE = (mode: string) => (mode === 'light' ? ['.rds-item__title'] : []);

const VARIANTS: ItemVariant[] = ['default', 'outline', 'muted'];
const SIZES: ItemSize[] = ['default', 'sm'];

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
    expect(await axeViolations(el, KNOWN_LIGHT_TITLE(mode))).toEqual([]);
  });
});

describe('Item behaviour', () => {
  it.fails('the title (item/title → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<Item title="Pedido #4821" />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('is a <li> inside an ItemGroup and a <div> alone; default rows get a line between them', async () => {
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
    // SettingsList's title is a PageHeader (h2): pageheader/title is text/heading too (#16, wave 3).
    expect(await axeViolations(el, [...KNOWN_LIGHT_TITLE('light'), '.rds-page-header__title'])).toEqual([]);
  });
});
