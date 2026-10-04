import { afterEach, describe, expect, it } from 'vitest';
import { Breadcrumb } from './breadcrumb';
import { Button } from './button';
import { PageHeader } from './page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// The Tabs root wraps the header and the views: the tabs slot takes the TabsList, the panels go under the header.
function Full() {
  return (
    <Tabs defaultValue="abertos">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: 'Início', href: '#/' }, { label: 'Pedidos' }]} />}
        title="Pedidos"
        description="Crie, acompanhe e encerre os pedidos da loja."
        actions={
          <>
            <Button variant="outline">Exportar</Button>
            <Button>Novo pedido</Button>
          </>
        }
        tabs={
          <TabsList aria-label="Pedidos">
            <TabsTrigger value="abertos" count={4}>
              Em aberto
            </TabsTrigger>
            <TabsTrigger value="arquivados">Arquivados</TabsTrigger>
          </TabsList>
        }
      />
      <TabsContent value="abertos">Pedidos em aberto</TabsContent>
      <TabsContent value="arquivados">Pedidos arquivados</TabsContent>
    </Tabs>
  );
}

describe.each(MODES)('PageHeader (%s)', (mode) => {
  it('breadcrumb, title, description, actions and tabs pass axe', async () => {
    const el = await render(<Full />, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('PageHeader behaviour', () => {
  it('the title (pageheader/title → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<PageHeader title="Pedidos" />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the top of a screen is a <header> with the page\'s <h1>; the order is path, title, actions, tabs', async () => {
    const el = await render(<Full />);
    const header = el.querySelector('header.rds-page-header')!;
    expect(header.querySelector('h1')!.textContent).toBe('Pedidos');
    const order = [...header.children].map((c) => c.className.split(' ')[0]);
    expect(order).toEqual(['rds-breadcrumb', 'rds-page-header__row', 'rds-tabs__bar']);
    expect(header.querySelectorAll('.rds-page-header__actions .rds-button')).toHaveLength(2);
  });

  it('titleAs="h2" is a section: a <div> with an <h2>', async () => {
    const el = await render(<PageHeader titleAs="h2" title="Zonas" />);
    expect(el.querySelector('header')).toBeNull();
    expect(el.querySelector('div.rds-page-header > .rds-page-header__row h2')!.textContent).toBe('Zonas');
  });

});
