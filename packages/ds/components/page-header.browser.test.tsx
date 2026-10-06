import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Breadcrumb } from './breadcrumb';
import { Button } from './button';
import { PageHeader } from './page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { MODES, SCHEMES, axeViolations, cleanup, render, renderIn, settle } from './__tests__/render';

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

const back = { href: '/pedidos', label: 'Pedidos' };

describe.each(SCHEMES)('PageHeader back and help (%s)', (scheme) => {
  it('with the way back and the help, with and without a description, passes axe', async () => {
    const el = await renderIn(
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHeader back={back} help={{ label: 'Como funciona', onClick: () => {} }} title="Pedido 1042" description="Itens, pagamento e entrega." actions={<Button>Salvar</Button>} />
        <PageHeader titleAs="h2" back={back} help={{ label: 'Como funciona', href: '/ajuda/pedido' }} title="Itens" />
      </div>,
      scheme,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('PageHeader back', () => {
  it('is a link to the parent (never history.back), an IconButton neutral ghost named "Voltar para {label}"', async () => {
    const el = await render(<PageHeader back={back} title="Pedido 1042" />);
    const link = el.querySelector<HTMLAnchorElement>('.rds-page-header__back a')!;
    expect(link.getAttribute('href')).toBe('/pedidos');
    expect(link.getAttribute('aria-label')).toBe('Voltar para Pedidos');
    expect(link.className).toContain('rds-button--neutral');
    expect(link.className).toContain('rds-button--ghost');
    expect(link.querySelector('svg')).not.toBeNull();
    link.focus();
    await settle();
    await expect.element(page.getByRole('tooltip')).toHaveTextContent('Pedidos');
  });

  it('sits in a band as tall as the title line, centred on it, 8 before the title, also with a description', async () => {
    for (const description of [undefined, 'Itens, pagamento e entrega, em duas linhas se precisar.']) {
      const el = await render(
        <div style={{ width: 600 }}>
          <PageHeader back={back} title="Pedido 1042" description={description} />
        </div>,
      );
      const band = el.querySelector('.rds-page-header__back')!.getBoundingClientRect();
      const title = el.querySelector('.rds-page-header__title')!.getBoundingClientRect();
      const button = el.querySelector('.rds-page-header__back a')!.getBoundingClientRect();
      expect(band.height).toBe(30);
      expect(band.top).toBe(title.top);
      expect(Math.round(button.top + button.height / 2)).toBe(Math.round(title.top + 15));
      expect(title.left - band.right).toBe(8);
      cleanup();
    }
  });

  it('stays in the same place on a phone (the actions wrap under the title)', async () => {
    await page.viewport(390, 800);
    const el = await render(<PageHeader back={back} title="Pedido 1042" actions={<Button>Salvar</Button>} />);
    const band = el.querySelector('.rds-page-header__back')!.getBoundingClientRect();
    const title = el.querySelector('.rds-page-header__title')!.getBoundingClientRect();
    expect(band.top).toBe(title.top);
    expect(el.querySelector('.rds-page-header__actions')!.getBoundingClientRect().top).toBeGreaterThan(title.bottom);
    await page.viewport(1280, 900);
  });
});

describe('PageHeader help', () => {
  it('an IconButton with its Tooltip on the title line, named "{label}: {title}"; onClick opens the help', async () => {
    const onClick = vi.fn();
    const el = await render(<PageHeader help={{ label: 'Como funciona', onClick }} title="Disparos" />);
    const button = el.querySelector<HTMLButtonElement>('.rds-page-header__help button')!;
    expect(button.getAttribute('aria-label')).toBe('Como funciona: Disparos');
    expect(button.className).toContain('rds-button--neutral');
    expect(button.className).toContain('rds-button--ghost');
    button.focus();
    await settle();
    await expect.element(page.getByRole('tooltip')).toHaveTextContent('Como funciona');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('with href it is a link', async () => {
    const el = await render(<PageHeader help={{ label: 'Como funciona', href: '/ajuda' }} title="Disparos" />);
    const link = el.querySelector<HTMLAnchorElement>('.rds-page-header__help a')!;
    expect(link.getAttribute('href')).toBe('/ajuda');
    expect(link.getAttribute('aria-label')).toBe('Como funciona: Disparos');
  });

  it('the title row is as tall as the title line (30) and the help adds no height, centred on it', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHeader help={{ label: 'Como funciona', onClick: () => {} }} title="Disparos" />
        <PageHeader title="Disparos" />
      </div>,
    );
    const [withHelp, plain] = el.querySelectorAll('.rds-page-header__title-row');
    expect(withHelp.getBoundingClientRect().height).toBe(30);
    expect(plain.getBoundingClientRect().height).toBe(30);
    expect(getComputedStyle(withHelp).alignItems).toBe('center');
    const title = withHelp.querySelector('.rds-page-header__title')!.getBoundingClientRect();
    const button = withHelp.querySelector('button')!.getBoundingClientRect();
    expect(Math.round(button.top + button.height / 2)).toBe(Math.round(title.top + title.height / 2));
  });

  it('without back and help nothing is added', async () => {
    const el = await render(<PageHeader title="Disparos" />);
    expect(el.querySelector('.rds-page-header__back, .rds-page-header__help')).toBeNull();
  });
});
