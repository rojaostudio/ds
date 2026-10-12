import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { DataTableHeader } from './data-table-header';
import { FilterChip, FilterChipGroup } from './filter-chip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// ds#134: strips that scroll sideways bleed to the edge of the screen.

const quick = (
  <FilterChipGroup aria-label="Situação">
    {['Todos', 'Pendentes', 'Pagos', 'Cancelados', 'Estornados', 'Arquivados'].map((l) => (
      <FilterChip key={l}>{l}</FilterChip>
    ))}
  </FilterChipGroup>
);

/** A page at 390 with the content padding (16 in the base mode). */
const Page = ({ children }: { children: React.ReactNode }) => (
  <div data-page style={{ paddingInline: 'var(--layout-content-padding-x)', width: '100%', boxSizing: 'border-box' }}>{children}</div>
);

describe('bleed', () => {
  it('DataTableHeader below 1024: the quick filters scroll edge to edge, the first chip aligned with the content', async () => {
    await page.viewport(390, 800);
    const el = await render(
      <Page>
        <DataTableHeader bleed search={{ value: '', onChange: () => {} }} quickFilters={quick} />
      </Page>,
    );
    const groups = Array.from(el.querySelectorAll<HTMLElement>('[aria-label="Filtros rápidos"]')).filter((g) => g.offsetParent !== null);
    expect(groups).toHaveLength(1);
    const strip = groups[0].getBoundingClientRect();
    const search = el.querySelector<HTMLElement>('.rds-data-table-header__search')!.getBoundingClientRect();
    const first = groups[0].querySelector<HTMLElement>('button')!.getBoundingClientRect();
    const edge = el.querySelector<HTMLElement>('[data-page]')!.getBoundingClientRect();
    expect(Math.round(strip.left)).toBe(Math.round(edge.left));
    expect(Math.round(strip.right)).toBe(Math.round(edge.right));
    expect(Math.round(first.left)).toBe(Math.round(search.left));
  });

  it('DataTableHeader from 1024: nothing changes, one group inline', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <Page>
        <DataTableHeader bleed search={{ value: '', onChange: () => {} }} quickFilters={quick} />
      </Page>,
    );
    const shown = Array.from(el.querySelectorAll<HTMLElement>('[aria-label="Filtros rápidos"]')).filter((g) => g.offsetParent !== null);
    expect(shown).toHaveLength(1);
    expect(shown[0].classList.contains('rds-data-table-header__quick--inline')).toBe(true);
  });

  it('Tabs: the bar reaches the edges and the first tab lines up with the content', async () => {
    await page.viewport(390, 800);
    const el = await render(
      <Page>
        <p style={{ margin: 0 }}>Conteúdo</p>
        <Tabs defaultValue="a">
          <TabsList aria-label="Pedidos" bleed>
            {['a', 'b', 'c', 'd', 'e'].map((v) => (
              <TabsTrigger key={v} value={v}>
                Aba longa {v}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Page>,
    );
    const bar = el.querySelector<HTMLElement>('.rds-tabs__bar')!.getBoundingClientRect();
    const tab = el.querySelector<HTMLElement>('[role="tab"]')!.getBoundingClientRect();
    const text = el.querySelector<HTMLElement>('p')!.getBoundingClientRect();
    const edge = el.querySelector<HTMLElement>('[data-page]')!.getBoundingClientRect();
    expect([Math.round(bar.left), Math.round(bar.right)]).toEqual([Math.round(edge.left), Math.round(edge.right)]);
    expect(Math.round(tab.left)).toBe(Math.round(text.left));
  });

  it.each(MODES)('passes axe at 390 (%s)', async (mode) => {
    await page.viewport(390, 800);
    const el = await render(
      <Page>
        <DataTableHeader bleed search={{ value: '', onChange: () => {} }} quickFilters={quick} />
        <Tabs defaultValue="a">
          <TabsList aria-label="Pedidos" bleed>
            <TabsTrigger value="a">Em uso</TabsTrigger>
            <TabsTrigger value="b">Arquivadas</TabsTrigger>
          </TabsList>
          <TabsContent value="a">Pedidos em uso</TabsContent>
          <TabsContent value="b">Pedidos arquivados</TabsContent>
        </Tabs>
      </Page>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});
