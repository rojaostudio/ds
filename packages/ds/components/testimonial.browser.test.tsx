import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { Avatar } from './avatar';
import { Testimonial, TestimonialItem } from './testimonial';
import { InContainer, WIDTHS } from './__tests__/blocks';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// [RDS] maps testimonial/title and testimonial/item/name to text/heading, flare on the rojao light theme (2.9:1 on
// white): a violation of the Figma itself, pinned with it.fails below.
const KNOWN_LIGHT = (mode: string) => (mode === 'light' ? ['.rds-block__title', '.rds-testimonial__name'] : []);

const block = (
  <Testimonial eyebrow="Depoimentos" title="Quem usa, conta" description="Uma frase que apresenta os depoimentos abaixo.">
    <TestimonialItem quote="Chegou em dois dias, bem embalado." name="Ana Souza" jobTitle="Designer, Loja Azul" avatar={<Avatar name="Ana Souza" />} />
    <TestimonialItem quote="Os avisos chegam certinhos no meu e-mail." name="Bruno Reis" jobTitle="Vendedor" avatar={<Avatar name="Bruno Reis" />} />
    <TestimonialItem quote="Contratei em uma semana." name="Carla Dias" />
  </Testimonial>
);

const columns = (el: HTMLElement) => getComputedStyle(el.querySelector('.rds-testimonial__items')!).gridTemplateColumns.split(' ').length;

describe.each(MODES)('Testimonial (%s)', (mode) => {
  it.each(WIDTHS)('in a %i container passes axe', async (width) => {
    const el = await render(<InContainer width={width}>{block}</InContainer>, mode);
    expect(await axeViolations(el, KNOWN_LIGHT(mode))).toEqual([]);
  });
});

describe('Testimonial behaviour', () => {
  it.fails('the title and the names (→ text/heading) pass axe on the rojao light theme', async () => {
    const el = await render(<InContainer width={1024}>{block}</InContainer>, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('follows the container, not the viewport: 3 columns at 1024, 1 at 360', async () => {
    await page.viewport(414, 896);
    expect(columns(await render(<InContainer width={1024}>{block}</InContainer>))).toBe(3);
    await page.viewport(1280, 800);
    expect(columns(await render(<InContainer width={360}>{block}</InContainer>))).toBe(1);
  });

  it('each item is a figure: the quote in a blockquote, the author in the figcaption', async () => {
    const el = await render(<InContainer width={1024}>{block}</InContainer>);
    const figures = el.querySelectorAll('li > figure');
    expect(figures).toHaveLength(3);
    expect(figures[0].querySelector('blockquote')!.textContent).toBe('Chegou em dois dias, bem embalado.');
    expect(figures[0].querySelector('figcaption')!.textContent).toContain('Ana Souza');
    expect(figures[0].querySelector('.rds-testimonial__mark')!.getAttribute('aria-hidden')).toBe('true');
  });
});
