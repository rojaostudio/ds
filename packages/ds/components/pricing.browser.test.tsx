import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { Pricing, PricingPlan } from './pricing';
import { PricingCard } from './pricing-card';
import { Button } from './button';
import { InContainer, WIDTHS } from './__tests__/blocks';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const FEATURES = ['Produtos ilimitados', 'Controle de estoque', 'Pedidos pelo WhatsApp', 'Relatórios de venda', 'Suporte por e-mail'];

const block = (
  <Pricing eyebrow="Planos" title="Escolha o seu plano" description="Comece grátis e mude de plano quando quiser.">
    <PricingPlan name="Grátis" price="R$ 0" description="Para começar." features={FEATURES.slice(0, 3)} cta={<Button variant="outline">Começar</Button>} />
    <PricingPlan
      name="Essencial"
      price="R$ 49,90"
      period="/mês"
      description="Para quem vende todo dia."
      features={FEATURES}
      recommended
      cta={<Button tone="inverse">Assinar</Button>}
    />
    <PricingPlan name="Pro" price="R$ 99,90" period="/mês" description="Para equipes." features={FEATURES} cta={<Button variant="outline">Assinar</Button>} />
  </Pricing>
);

const tops = (el: HTMLElement) => [...el.querySelectorAll('.rds-pricing-plan')].map((p) => Math.round(p.getBoundingClientRect().top));

describe.each(MODES)('Pricing (%s)', (mode) => {
  it.each(WIDTHS)('in a %i container passes axe', async (width) => {
    const el = await render(<InContainer width={width}>{block}</InContainer>, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Pricing behaviour', () => {
  it('the title (pricing/title → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<InContainer width={1024}>{block}</InContainer>, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('follows the container, not the viewport: plans side by side at 1024, stacked at 360', async () => {
    await page.viewport(414, 896);
    const wide = await render(<InContainer width={1024}>{block}</InContainer>);
    expect(new Set(tops(wide)).size).toBe(1);
    expect(getComputedStyle(wide.querySelector('.rds-pricing-plan')!).paddingLeft).toBe('15px');
    await page.viewport(1280, 800);
    const narrow = await render(<InContainer width={360}>{block}</InContainer>);
    const t = tops(narrow);
    expect(t[1]).toBeGreaterThan(t[0]);
    expect(t[2]).toBeGreaterThan(t[1]);
    expect(getComputedStyle(narrow.querySelector('.rds-pricing__plans')!).rowGap).toBe('24px');
    expect(getComputedStyle(narrow.querySelector('.rds-pricing-plan')!).paddingLeft).toBe('23px');
  });

  it('a section named by its h2; each plan a list item with an h3, its price and a list of features', async () => {
    const el = await render(<InContainer width={1024}>{block}</InContainer>);
    const section = el.querySelector('section')!;
    expect(section.getAttribute('aria-labelledby')).toBe(section.querySelector('h2')!.id);
    const plans = section.querySelectorAll('ul.rds-pricing__plans > li');
    expect(plans).toHaveLength(3);
    expect(plans[1].querySelector('h3')!.textContent).toBe('Essencial');
    expect(plans[1].querySelector('.rds-pricing-plan__price-row')!.textContent).toBe('R$ 49,90/mês');
    expect(plans[1].querySelectorAll('.rds-pricing-plan__features > li')).toHaveLength(5);
    expect(plans[1].querySelector('.rds-pricing-plan__check')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('recommended inverts the surface and shows the badge half out of the top', async () => {
    const el = await render(<InContainer width={1024}>{block}</InContainer>);
    const [plain, recommended] = el.querySelectorAll<HTMLElement>('.rds-pricing-plan');
    expect(getComputedStyle(recommended).backgroundColor).not.toBe(getComputedStyle(plain).backgroundColor);
    expect(plain.querySelector('.rds-badge')).toBeNull();
    const badge = recommended.querySelector<HTMLElement>('.rds-badge')!;
    expect(badge.textContent).toBe('Recomendado');
    const b = badge.getBoundingClientRect();
    const r = recommended.getBoundingClientRect();
    expect(Math.round(b.top + b.height / 2)).toBe(Math.round(r.top));
    expect(Math.round(b.left + b.width / 2)).toBe(Math.round(r.left + r.width / 2));
  });

  it('the deprecated PricingCard is a PricingPlan', async () => {
    const el = await render(
      <PricingCard name="Essencial" price="R$ 49,90" period="/mês" features={['Produtos ilimitados']} recommended recommendedLabel="Mais vendido" cta={<a href="#assinar">Assinar</a>} />,
    );
    const plan = el.querySelector('.rds-pricing-plan--recommended')!;
    expect(plan.querySelector('.rds-badge')!.textContent).toBe('Mais vendido');
    expect(plan.querySelector('h3')!.textContent).toBe('Essencial');
  });
});
