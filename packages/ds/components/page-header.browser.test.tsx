import { afterEach, describe, expect, it } from 'vitest';
import { Breadcrumb } from './breadcrumb';
import { Button } from './button';
import { PageHeader } from './page-header';
import { PageShell } from './page-shell';
import { SectionHeader } from './section-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// [RDS] maps pageheader/title (and, inside, breadcrumb/label/current and tabs/label/selected) to text/heading, flare on
// the rojao light theme (2.9:1 on white, under 3:1 even for large text): a violation of the Figma itself, as in
// item.browser.test.tsx. Kept out of the light matrix and pinned with it.fails.
const KNOWN_LIGHT = (mode: string) =>
  mode === 'light' ? ['.rds-page-header__title', '.rds-breadcrumb__link--current', '.rds-tabs__tab[data-state="active"]'] : [];

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
    expect(await axeViolations(el, KNOWN_LIGHT(mode))).toEqual([]);
  });
});

describe('PageHeader behaviour', () => {
  it.fails('the title (pageheader/title → text/heading) passes axe on the rojao light theme', async () => {
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

  it('SectionHeader and PageShell.Header (deprecated) are PageHeaders', async () => {
    const el = await render(
      <PageShell>
        <PageShell.Header title="Pedidos" actions={<Button>Novo pedido</Button>} />
        <PageShell.Body>
          <SectionHeader eyebrow="Conteúdo" number="02" title="Seções da vitrine" description="Ative e edite" />
        </PageShell.Body>
      </PageShell>,
      'dark',
    );
    expect(el.querySelector('header.rds-page-header h1')!.textContent).toBe('Pedidos');
    expect(el.querySelector('div.rds-page-header h2')!.textContent).toBe('Seções da vitrine');
    expect(el.textContent).toContain('02 · Conteúdo');
  });
});
