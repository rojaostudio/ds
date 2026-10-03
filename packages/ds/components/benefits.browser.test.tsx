import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { Benefits, BenefitsItem } from './benefits';
import { Button } from './button';
import { CheckIcon, SearchIcon, StarIcon } from './internal/icons';
import { InContainer, WIDTHS } from './__tests__/blocks';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const block = (
  <Benefits eyebrow="Por que usar" title="O que você ganha" description="Uma frase que resume os benefícios abaixo.">
    <BenefitsItem icon={<SearchIcon />} title="Busca rápida" description="Ache o produto certo em segundos." link={<Button variant="ghost">Saiba mais</Button>} />
    <BenefitsItem icon={<StarIcon />} title="Lojas avaliadas" description="Veja o que dizem de cada loja." />
    <BenefitsItem icon={<CheckIcon />} title="Compra fácil" description="Um toque e o pedido sai." />
  </Benefits>
);

const columns = (el: HTMLElement) => getComputedStyle(el.querySelector('.rds-benefits__items')!).gridTemplateColumns.split(' ').length;

describe.each(MODES)('Benefits (%s)', (mode) => {
  it.each(WIDTHS)('in a %i container passes axe', async (width) => {
    const el = await render(<InContainer width={width}>{block}</InContainer>, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Benefits behaviour', () => {
  it('the titles (benefits/title, benefits/item/title → text/heading, navy) pass axe on the rojao light theme', async () => {
    const el = await render(<InContainer width={1024}>{block}</InContainer>, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('follows the container, not the viewport: 3 columns at 1024, 1 at 360', async () => {
    await page.viewport(414, 896);
    const wide = await render(<InContainer width={1024}>{block}</InContainer>);
    expect(columns(wide)).toBe(3);
    expect(getComputedStyle(wide.querySelector('.rds-block__title')!).fontSize).toBe('36px');
    await page.viewport(1280, 800);
    const narrow = await render(<InContainer width={360}>{block}</InContainer>);
    expect(columns(narrow)).toBe(1);
    expect(getComputedStyle(narrow.querySelector('.rds-block__title')!).fontSize).toBe('24px');
    expect(getComputedStyle(narrow.querySelector('.rds-block__inner')!).paddingLeft).toBe('16px');
  });

  it('a section named by its h2; each item is a list item with an h3', async () => {
    const el = await render(<InContainer width={1024}>{block}</InContainer>);
    const section = el.querySelector('section')!;
    const h2 = section.querySelector('h2')!;
    expect(section.getAttribute('aria-labelledby')).toBe(h2.id);
    expect(h2.textContent).toBe('O que você ganha');
    expect(section.querySelectorAll('ul > li h3')).toHaveLength(3);
    expect(section.querySelector('.rds-benefits__icon')!.getAttribute('aria-hidden')).toBe('true');
  });
});
