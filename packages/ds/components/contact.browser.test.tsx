import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { page } from 'vitest/browser';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Contact } from './contact';
import { Input } from './input';
import { Textarea } from './textarea';
import { InContainer, WIDTHS } from './__tests__/blocks';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const block = (onSubmit: (data: FormData) => void = () => {}) => (
  <Contact eyebrow="Contato" title="Fale com a gente" description="Conte o que você precisa. Respondemos por e-mail." onSubmit={onSubmit}>
    <Input label="Nome" name="name" />
    <Input label="E-mail" name="email" type="email" />
    <Textarea label="Mensagem" name="message" />
    <Checkbox name="consent">Aceito receber a resposta por e-mail</Checkbox>
    <Button type="submit">Enviar mensagem</Button>
  </Contact>
);

describe.each(MODES)('Contact (%s)', (mode) => {
  it.each(WIDTHS)('in a %i container passes axe', async (width) => {
    const el = await render(<InContainer width={width}>{block()}</InContainer>, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Contact behaviour', () => {
  it('the title (contact/title → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<InContainer width={1024}>{block()}</InContainer>, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('follows the container: the form up to 400 at 1024, the full 328 at 360; the button takes the width', async () => {
    await page.viewport(414, 896);
    const wide = await render(<InContainer width={1024}>{block()}</InContainer>);
    expect(wide.querySelector('form')!.getBoundingClientRect().width).toBe(400);
    expect(getComputedStyle(wide.querySelector('.rds-block__inner')!).paddingTop).toBe('64px');
    const narrow = await render(<InContainer width={360}>{block()}</InContainer>);
    const form = narrow.querySelector('form')!.getBoundingClientRect();
    expect(form.width).toBe(328);
    expect(narrow.querySelector('button[type="submit"]')!.getBoundingClientRect().width).toBe(328);
  });

  it('a form named by the title, sent with its data and no native validation', async () => {
    const onSubmit = vi.fn();
    const el = await render(<InContainer width={1024}>{block(onSubmit)}</InContainer>);
    const form = el.querySelector('form')!;
    expect(form.noValidate).toBe(true);
    expect(form.getAttribute('aria-labelledby')).toBe(el.querySelector('h2')!.id);
    el.querySelector<HTMLInputElement>('input[name="name"]')!.value = 'Ana';
    await act(async () => el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect((onSubmit.mock.calls[0][0] as FormData).get('name')).toBe('Ana');
  });
});
