import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { Footer, FooterColumn } from './footer';
import { StarIcon } from './internal/icons';
import { InContainer, WIDTHS } from './__tests__/blocks';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// The logo comes by slot: the design system carries no client logo. A plain text mark stands in for it here.
const block = (
  <Footer
    logo={
      <a href="/" style={{ color: 'inherit' }}>
        Marca
      </a>
    }
    tagline="Pedidos entregues em todo o Brasil."
    social={
      <>
        <a href="https://example.com/a" aria-label="Perfil A">
          <StarIcon />
        </a>
        <a href="https://example.com/b" aria-label="Perfil B">
          <StarIcon />
        </a>
      </>
    }
    copyright="© 2026 Marca. Todos os direitos reservados."
  >
    <FooterColumn title="Clientes">
      <a href="/produtos">Buscar produtos</a>
      <a href="/pedidos">Acompanhar pedido</a>
    </FooterColumn>
    <FooterColumn title="Lojas">
      <a href="/vender">Abrir uma loja</a>
      <a href="/planos">Planos</a>
    </FooterColumn>
  </Footer>
);

describe.each(MODES)('Footer (%s)', (mode) => {
  it.each(WIDTHS)('in a %i container, at the top level, passes axe', async (width) => {
    const el = await render(<InContainer width={width}>{block}</InContainer>, mode, { host: 'div' });
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Footer behaviour', () => {
  it('landmarks: the contentinfo at the top level, a navigation per column named by its title, the profiles list named', async () => {
    await render(<InContainer width={1024}>{block}</InContainer>, 'light', { host: 'div' });
    await expect.element(page.getByRole('contentinfo')).toBeInTheDocument();
    const navs = page.getByRole('navigation');
    expect(navs.elements()).toHaveLength(2);
    await expect.element(page.getByRole('navigation', { name: 'Clientes' })).toBeInTheDocument();
    await expect.element(page.getByRole('navigation', { name: 'Lojas' })).toBeInTheDocument();
    await expect.element(page.getByRole('list', { name: 'Redes sociais' })).toBeInTheDocument();
    expect(page.getByRole('navigation', { name: 'Clientes' }).getByRole('listitem').elements()).toHaveLength(2);
  });

  it('follows the container, not the viewport: brand and columns side by side at 1024, stacked at 360', async () => {
    await page.viewport(414, 896);
    const wide = await render(<InContainer width={1024}>{block}</InContainer>);
    expect(getComputedStyle(wide.querySelector('.rds-footer__sitemap')!).flexDirection).toBe('row');
    expect(wide.querySelector('.rds-footer__brand')!.getBoundingClientRect().width).toBe(220);
    await page.viewport(1280, 800);
    const narrow = await render(<InContainer width={360}>{block}</InContainer>);
    expect(getComputedStyle(narrow.querySelector('.rds-footer__sitemap')!).flexDirection).toBe('column');
    expect(getComputedStyle(narrow.querySelector('.rds-footer__columns')!).flexDirection).toBe('column');
  });
});
