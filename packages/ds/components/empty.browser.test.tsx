import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './button';
import { Empty } from './empty';
import { SearchIcon } from './internal/icons';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// [RDS] maps empty/title to text/heading, which on the rojao light theme is flare (#ff6a00, 2.9:1 on white): a violation of
// the Figma itself. Kept out of the light matrix and pinned with it.fails below, as in alert.browser.test.tsx.
const KNOWN_LIGHT_TITLE = (mode: string) => (mode === 'light' ? ['.rds-empty__title'] : []);

describe.each(MODES)('Empty (%s)', (mode) => {
  it('with icon, description and two actions, and the danger tone, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 400 }}>
        <Empty
          icon={<SearchIcon />}
          title="Nenhum pedido por aqui"
          description="Quando você criar um pedido, ele aparece nesta lista."
          action={<Button>Criar pedido</Button>}
          secondaryAction={<Button variant="outline">Ver modelos</Button>}
        />
        <Empty icon={<SearchIcon />} tone="danger" title="Não deu para carregar" />
        <Empty title="Sem ícone e sem ação" />
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT_TITLE(mode))).toEqual([]);
  });
});

describe('Empty behaviour', () => {
  it.fails('the title (empty/title → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<Empty title="Nenhum pedido por aqui" />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the title is a heading of the given level; the icon is a decorative lg soft Tile', async () => {
    const el = await render(<Empty icon={<SearchIcon />} title="Nada encontrado" titleAs="h2" />);
    expect(el.querySelector('h2')!.textContent).toBe('Nada encontrado');
    const tile = el.querySelector('.rds-tile')!;
    expect(tile.className).toContain('rds-tile--neutral-soft');
    expect(tile.className).toContain('rds-tile--lg');
    expect(tile.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.rds-empty__actions')).toBeNull();
  });
});
