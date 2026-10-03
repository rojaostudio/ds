import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { page } from 'vitest/browser';
import { Banner } from './banner';
import { Button } from './button';
import { InContainer, WIDTHS } from './__tests__/blocks';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const block = (onClose?: () => void) => (
  <Banner highlight="Novidade:" message="Veja os produtos que chegaram esta semana." action={<Button variant="ghost">Ver produtos</Button>} onClose={onClose ?? (() => {})} />
);

describe.each(MODES)('Banner (%s)', (mode) => {
  it.each(WIDTHS)('in a %i container passes axe', async (width) => {
    const el = await render(<InContainer width={width}>{block()}</InContainer>, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Banner behaviour', () => {
  it('the highlight (banner/highlight → text/heading, navy) passes axe on the rojao light theme', async () => {
    const el = await render(<InContainer width={1024}>{block()}</InContainer>, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('follows the container, not the viewport: a row at 1024, stacked at 360', async () => {
    await page.viewport(414, 896);
    const wide = await render(<InContainer width={1024}>{block()}</InContainer>);
    expect(getComputedStyle(wide.querySelector('.rds-banner__body')!).flexDirection).toBe('row');
    expect(getComputedStyle(wide.querySelector('.rds-banner__content')!).justifyContent).toBe('center');
    await page.viewport(1280, 800);
    const narrow = await render(<InContainer width={360}>{block()}</InContainer>);
    expect(getComputedStyle(narrow.querySelector('.rds-banner__body')!).flexDirection).toBe('column');
    expect(getComputedStyle(narrow.querySelector('.rds-banner__highlight')!).display).toBe('block');
  });

  it('a named region; the × hides it, calls onClose and moves the focus on', async () => {
    const onClose = vi.fn();
    const el = await render(
      <InContainer width={1024}>
        {block(onClose)}
        <button>Depois</button>
      </InContainer>,
    );
    const region = el.querySelector('[role="region"]')!;
    expect(region.getAttribute('aria-label')).toBe('Aviso');
    expect(region.querySelector('.rds-banner__icon')!.getAttribute('aria-hidden')).toBe('true');
    const close = el.querySelector<HTMLButtonElement>('button[aria-label="Fechar aviso"]')!;
    close.focus();
    await act(async () => close.click());
    expect(el.querySelector('.rds-banner')).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
    await expect.poll(() => document.activeElement?.textContent).toBe('Depois');
  });
});
