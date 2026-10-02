import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { page, userEvent } from 'vitest/browser';
import { Button } from './button';
import { TopNavigation } from './top-navigation';
import { InContainer } from './__tests__/blocks';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// [RDS] maps the neutral outline and ghost Button labels to text/heading, flare on the rojao light theme (2.9:1 on
// white): a violation of the Figma itself (button.browser.test.tsx), pinned with it.fails below.
const KNOWN_LIGHT = (mode: string) => (mode === 'light' ? ['.rds-topnav .rds-button--neutral'] : []);

// The logo comes by slot: the design system carries no client logo. A plain text mark stands in for it here.
const bar = (props: { defaultOpen?: boolean } = {}) => (
  <TopNavigation
    {...props}
    logo={
      <a href="/" style={{ color: 'inherit' }}>
        Marca
      </a>
    }
    links={
      <>
        <Button asChild tone="neutral" variant="ghost">
          <a href="/produtos">Produtos</a>
        </Button>
        <Button asChild tone="neutral" variant="ghost">
          <a href="/lojas">Lojas</a>
        </Button>
      </>
    }
    actions={
      <>
        <Button tone="neutral" variant="outline">
          Entrar
        </Button>
        <Button>Criar conta</Button>
      </>
    }
  />
);

const shown = (el: Element | null) => !!el && getComputedStyle(el).display !== 'none' && (el as HTMLElement).offsetParent !== null;

describe.each(MODES)('TopNavigation (%s)', (mode) => {
  it.each([
    [1024, false],
    [360, false],
    [360, true],
  ] as const)('in a %i container (open: %s), at the top level, passes axe', async (width, open) => {
    const el = await render(<InContainer width={width}>{bar({ defaultOpen: open })}</InContainer>, mode, { host: 'div' });
    expect(await axeViolations(el, KNOWN_LIGHT(mode))).toEqual([]);
  });
});

describe('TopNavigation behaviour', () => {
  it.fails('the neutral links and Entrar (→ text/heading) pass axe on the rojao light theme', async () => {
    const el = await render(<InContainer width={1024}>{bar()}</InContainer>, 'light', { host: 'div' });
    expect(await axeViolations(el)).toEqual([]);
  });

  it('landmarks: the banner at the top level, with the named navigation inside', async () => {
    await render(<InContainer width={1024}>{bar()}</InContainer>, 'light', { host: 'div' });
    await expect.element(page.getByRole('banner')).toBeInTheDocument();
    const nav = page.getByRole('banner').getByRole('navigation', { name: 'Principal' });
    await expect.element(nav).toBeInTheDocument();
    expect(nav.getByRole('link').elements()).toHaveLength(2);
  });

  it('follows the container, not the viewport: links inline at 1024 without the menu button; the button at 360', async () => {
    await page.viewport(414, 896);
    const wide = await render(<InContainer width={1024}>{bar()}</InContainer>);
    expect(shown(wide.querySelector('nav'))).toBe(true);
    expect(shown(wide.querySelector('.rds-topnav__toggle'))).toBe(false);
    await page.viewport(1280, 800);
    const narrow = await render(<InContainer width={360}>{bar()}</InContainer>);
    expect(shown(narrow.querySelector('nav'))).toBe(false);
    expect(shown(narrow.querySelector('.rds-topnav__toggle'))).toBe(true);
  });

  it('the menu button opens the panel (aria-expanded, aria-controls); Escape closes it and returns the focus', async () => {
    const el = await render(<InContainer width={360}>{bar()}</InContainer>);
    const toggle = el.querySelector<HTMLButtonElement>('.rds-topnav__toggle')!;
    expect(toggle.getAttribute('aria-label')).toBe('Abrir menu');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    const panel = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    await act(async () => toggle.click());
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Fechar menu');
    expect(shown(panel.querySelector('nav'))).toBe(true);
    // Stacked, full width, the main action on top.
    const [enter, signUp] = [...panel.querySelectorAll<HTMLElement>('.rds-topnav__actions > .rds-button')];
    expect(signUp.getBoundingClientRect().top).toBeLessThan(enter.getBoundingClientRect().top);
    panel.querySelector<HTMLAnchorElement>('a')!.focus();
    await userEvent.keyboard('{Escape}');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
    expect(shown(panel.querySelector('nav'))).toBe(false);
  });
});
