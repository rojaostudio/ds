import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { page, userEvent } from 'vitest/browser';
import { Newsletter } from './newsletter';
import { InContainer, WIDTHS } from './__tests__/blocks';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// [RDS] maps newsletter/title to text/heading, flare on the rojao light theme (2.9:1 on white): a violation of the
// Figma itself, pinned with it.fails below.
const KNOWN_LIGHT = (mode: string) => (mode === 'light' ? ['.rds-block__title'] : []);

const block = (onSubscribe: (email: string) => void = () => {}) => (
  <Newsletter
    title="Novidades no seu e-mail"
    description="Os produtos que combinam com você, sem voltar ao site."
    note="Sem spam. Cancele quando quiser."
    onSubscribe={onSubscribe}
  />
);

describe.each(MODES)('Newsletter (%s)', (mode) => {
  it.each(WIDTHS)('in a %i container passes axe, also with the error', async (width) => {
    const el = await render(<InContainer width={width}>{block()}</InContainer>, mode);
    expect(await axeViolations(el, KNOWN_LIGHT(mode))).toEqual([]);
    await act(async () => el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
    expect(el.querySelector('[aria-invalid="true"]')).not.toBeNull();
    expect(await axeViolations(el, KNOWN_LIGHT(mode))).toEqual([]);
  });
});

describe('Newsletter behaviour', () => {
  it.fails('the title (newsletter/title → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<InContainer width={1024}>{block()}</InContainer>, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('follows the container: the field (320) and the button in a row at 1024, stacked full width at 360', async () => {
    await page.viewport(414, 896);
    const wide = await render(<InContainer width={1024}>{block()}</InContainer>);
    expect(getComputedStyle(wide.querySelector('.rds-newsletter__form')!).flexDirection).toBe('row');
    expect(wide.querySelector('.rds-newsletter__field')!.getBoundingClientRect().width).toBe(320);
    const narrow = await render(<InContainer width={360}>{block()}</InContainer>);
    expect(getComputedStyle(narrow.querySelector('.rds-newsletter__form')!).flexDirection).toBe('column');
    expect(narrow.querySelector('button[type="submit"]')!.getBoundingClientRect().width).toBe(328);
  });

  it('names the field off screen; a bad e-mail shows the error, a good one subscribes', async () => {
    const onSubscribe = vi.fn();
    const el = await render(<InContainer width={1024}>{block(onSubscribe)}</InContainer>);
    const input = el.querySelector('input')!;
    expect(input.getAttribute('aria-label')).toBe('E-mail');
    input.focus();
    await userEvent.keyboard('ana{Enter}');
    expect(onSubscribe).not.toHaveBeenCalled();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const error = document.getElementById(input.getAttribute('aria-describedby')!)!;
    expect(error.textContent).toContain('Falta o @ ou o domínio');
    await userEvent.keyboard('@empresa.com.br{Enter}');
    expect(onSubscribe).toHaveBeenCalledWith('ana@empresa.com.br', expect.anything());
  });
});
