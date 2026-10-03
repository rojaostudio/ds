import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { userEvent } from 'vitest/browser';
import { Accordion, AccordionItem } from './accordion';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const faq = (props: { disabled?: boolean } = {}) => [
  <AccordionItem key="a" value="a" title="Como faço um pedido?">
    Escolha o produto, confira os detalhes e toque em Comprar.
  </AccordionItem>,
  <AccordionItem key="b" value="b" title="Posso editar o pedido depois?">
    Pode, a qualquer momento, em Perfil.
  </AccordionItem>,
  <AccordionItem key="c" value="c" title="A loja vê meu telefone?" disabled={props.disabled}>
    Só depois que você aceitar o contato.
  </AccordionItem>,
];

describe.each(MODES)('Accordion (%s)', (mode) => {
  it('closed, open and disabled items pass axe', async () => {
    const el = await render(<Accordion defaultValue="a">{faq({ disabled: true })}</Accordion>, mode);
    expect(await axeViolations(el)).toEqual([]);
  });

  it('multiple, all open, passes axe', async () => {
    const el = await render(
      <Accordion type="multiple" defaultValue={['a', 'b', 'c']}>
        {faq()}
      </Accordion>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Accordion behaviour', () => {
  it('the title (accordion/title → text/heading, navy) passes axe on the rojao light theme', async () => {
    const el = await render(<Accordion>{faq()}</Accordion>, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('each trigger is a button in a heading, tied to its region', async () => {
    const el = await render(<Accordion defaultValue="a">{faq()}</Accordion>);
    const triggers = el.querySelectorAll('h3 > button');
    expect(triggers).toHaveLength(3);
    const first = triggers[0];
    expect(first.getAttribute('aria-expanded')).toBe('true');
    const region = document.getElementById(first.getAttribute('aria-controls')!)!;
    expect(region.getAttribute('role')).toBe('region');
    expect(region.getAttribute('aria-labelledby')).toBe(first.id);
    expect(triggers[1].getAttribute('aria-expanded')).toBe('false');
  });

  it('keyboard: arrows move between triggers, Enter and Space open, single closes the other', async () => {
    const onValueChange = vi.fn();
    const el = await render(<Accordion onValueChange={onValueChange}>{faq()}</Accordion>);
    const [a, b, c] = el.querySelectorAll<HTMLButtonElement>('h3 > button');
    a.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(b);
    await userEvent.keyboard('{Enter}');
    expect(b.getAttribute('aria-expanded')).toBe('true');
    expect(onValueChange).toHaveBeenLastCalledWith('b');
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(c);
    await userEvent.keyboard(' ');
    expect(c.getAttribute('aria-expanded')).toBe('true');
    expect(b.getAttribute('aria-expanded')).toBe('false');
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(a);
    // single is collapsible: the open item closes again.
    await act(async () => c.click());
    expect(c.getAttribute('aria-expanded')).toBe('false');
  });

  it('a disabled item does not open', async () => {
    const el = await render(<Accordion>{faq({ disabled: true })}</Accordion>);
    const c = el.querySelectorAll<HTMLButtonElement>('h3 > button')[2];
    expect(c.disabled).toBe(true);
    await act(async () => c.click());
    expect(c.getAttribute('aria-expanded')).toBe('false');
  });
});
