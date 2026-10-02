import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { Accordion, AccordionItem } from './accordion';
import { Button } from './button';
import { FAQ } from './faq';
import { InContainer, WIDTHS } from './__tests__/blocks';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// [RDS] maps faq/title and accordion/title to text/heading, flare on the rojao light theme (2.9:1 on white): a
// violation of the Figma itself, pinned with it.fails below, as in accordion.browser.test.tsx.
const KNOWN_LIGHT = (mode: string) => (mode === 'light' ? ['.rds-block__title', '.rds-accordion__title'] : []);

const block = (
  <FAQ eyebrow="Dúvidas" title="Perguntas frequentes" supportText="Ainda tem dúvidas?" supportAction={<Button variant="ghost">Falar com o suporte</Button>}>
    <Accordion defaultValue="a">
      <AccordionItem value="a" title="Como faço um pedido?">
        Escolha o produto, confira os detalhes e toque em Comprar.
      </AccordionItem>
      <AccordionItem value="b" title="Posso editar o pedido depois?">
        Pode, a qualquer momento, em Perfil.
      </AccordionItem>
    </Accordion>
  </FAQ>
);

describe.each(MODES)('FAQ (%s)', (mode) => {
  it.each(WIDTHS)('in a %i container passes axe', async (width) => {
    const el = await render(<InContainer width={width}>{block}</InContainer>, mode);
    expect(await axeViolations(el, KNOWN_LIGHT(mode))).toEqual([]);
  });
});

describe('FAQ behaviour', () => {
  it.fails('the title (faq/title → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<InContainer width={1024}>{block}</InContainer>, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('follows the container: the Accordion up to 640 and the support in a row at 1024; a column at 360', async () => {
    await page.viewport(414, 896);
    const wide = await render(<InContainer width={1024}>{block}</InContainer>);
    expect(wide.querySelector('.rds-faq__questions')!.getBoundingClientRect().width).toBe(640);
    expect(getComputedStyle(wide.querySelector('.rds-faq__support')!).flexDirection).toBe('row');
    const narrow = await render(<InContainer width={360}>{block}</InContainer>);
    expect(narrow.querySelector('.rds-faq__questions')!.getBoundingClientRect().width).toBe(328);
    expect(getComputedStyle(narrow.querySelector('.rds-faq__support')!).flexDirection).toBe('column');
  });

  it('the questions are h3 under the block h2', async () => {
    const el = await render(<InContainer width={1024}>{block}</InContainer>);
    expect(el.querySelector('section > .rds-block__inner h2')!.textContent).toBe('Perguntas frequentes');
    expect(el.querySelectorAll('h3 > button')).toHaveLength(2);
  });
});
