import { afterEach, describe, expect, it } from 'vitest';
import { Card, CardContent, CardHeader } from './card';
import { Item, ItemGroup, ItemSkeleton, type ItemSize } from './item';
import { Sparkline } from './sparkline';
import { Stat } from './stat';
import { Status } from './status';
import { Tile } from './tile';
import { InfoIcon } from './internal/icons';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// ds#127: Stat loading, ItemSkeleton and the lg card header.

describe('Stat loading', () => {
  it.each([true, false])('framed=%s: as tall as the loaded Stat, with and without caption and sparkline', async (framed) => {
    for (const [caption, sparkline] of [
      ['vs. agosto', undefined],
      [undefined, undefined],
      ['vs. agosto', <Sparkline key="s" data={[3, 5, 4, 7]} />],
    ] as const) {
      const el = await render(
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', width: 520 }}>
          <Stat framed={framed} label="Pedidos" value="1.284" caption={caption} sparkline={sparkline} style={{ width: 240 }} />
          <Stat framed={framed} loading label="Pedidos" value="1.284" caption={caption} sparkline={sparkline} style={{ width: 240 }} />
        </div>,
      );
      const [loaded, loading] = Array.from(el.querySelectorAll<HTMLElement>('.rds-stat'));
      expect(loading.getBoundingClientRect().height).toBe(loaded.getBoundingClientRect().height);
      cleanup();
    }
  });

  it('is aria-busy, keeps the label for screen readers and hides the value', async () => {
    const el = await render(<Stat loading label="Pedidos no mês" value="1.284" />);
    const stat = el.querySelector('.rds-stat')!;
    expect(stat.getAttribute('aria-busy')).toBe('true');
    expect(stat.textContent).toBe('Pedidos no mês');
    expect(stat.querySelectorAll('.rds-skeleton').length).toBe(2);
  });

  it.each(MODES)('passes axe (%s)', async (mode) => {
    const el = await render(<Stat loading label="Pedidos" value="1.284" caption="vs. agosto" />, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('ItemSkeleton', () => {
  const SIZES: ItemSize[] = ['md', 'sm'];

  it.each(SIZES)('size=%s: as tall as the Item row it stands for', async (size) => {
    const el = await render(
      <div style={{ width: 400 }}>
        <ItemGroup aria-label="Carregadas">
          <Item
            variant="row"
            size={size}
            media={<Tile icon={<InfoIcon />} variant="soft" />}
            title="Pedido #4821"
            description="3 itens"
            trailing={<Status tone="warning" size="sm">Revisar</Status>}
          />
          <Item variant="row" size={size} title="Pedido #4822" description="1 item" />
        </ItemGroup>
        <ItemGroup aria-label="Carregando" aria-busy="true">
          <ItemSkeleton size={size} />
          <ItemSkeleton size={size} />
        </ItemGroup>
      </div>,
    );
    const rows = Array.from(el.querySelectorAll<HTMLElement>('.rds-item'));
    const h = (n: HTMLElement) => n.getBoundingClientRect().height;
    expect(h(rows[2])).toBe(h(rows[0]));
    // the last row goes without the line, at the same height
    expect(h(rows[3])).toBe(h(rows[2]));
    expect(getComputedStyle(rows[3]).borderBottomWidth).toBe('0px');
    expect(getComputedStyle(rows[2]).borderBottomWidth).not.toBe('0px');
  });

  it('is an <li> in an ItemGroup, hidden from screen readers, and the parts turn off', async () => {
    const el = await render(
      <ItemGroup aria-label="Carregando" aria-busy="true">
        <ItemSkeleton showMedia={false} showDescription={false} showTrailing={false} showDivider={false} />
      </ItemGroup>,
    );
    const row = el.querySelector('.rds-item')!;
    expect(row.tagName).toBe('LI');
    expect(row.getAttribute('aria-hidden')).toBe('true');
    expect(row.querySelectorAll('.rds-skeleton').length).toBe(1);
    expect(row.classList.contains('rds-item--no-divider')).toBe(true);
  });

  it.each(MODES)('passes axe (%s)', async (mode) => {
    const el = await render(
      <ItemGroup aria-label="Carregando" aria-busy="true">
        <ItemSkeleton />
        <ItemSkeleton size="sm" />
      </ItemGroup>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('CardHeader size=lg', () => {
  it('the title takes type/heading and outweighs the Stat value inside', async () => {
    const el = await render(
      <Card>
        <CardHeader size="lg" title="Vendas do mês" description="Últimos 30 dias" />
        <CardContent>
          <Stat framed={false} label="Receita" value="R$ 48.320" />
        </CardContent>
      </Card>,
    );
    const title = el.querySelector<HTMLElement>('.rds-card__title')!;
    const value = el.querySelector<HTMLElement>('.rds-stat__value')!;
    const t = getComputedStyle(title);
    const v = getComputedStyle(value);
    expect(parseFloat(t.fontSize)).toBeGreaterThan(parseFloat(v.fontSize));
    expect(Number(t.fontWeight)).toBeGreaterThanOrEqual(Number(v.fontWeight));
  });

  it('without size the title stays as before', async () => {
    const el = await render(
      <Card>
        <CardHeader title="Vendas do mês" />
      </Card>,
    );
    expect(el.querySelector('.rds-card__header--lg')).toBeNull();
  });
});
