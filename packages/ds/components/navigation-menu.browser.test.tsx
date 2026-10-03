import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { NavigationMenu, type NavigationMenuEntry } from './navigation-menu';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

const ITEMS: NavigationMenuEntry[] = [
  {
    label: 'Para lojas',
    links: [
      { title: 'Abrir uma loja', description: 'Monte a vitrine e receba pedidos.', href: '#/vender' },
      { title: 'Planos', description: 'Compare os planos.', href: '#/planos' },
      { title: 'Central de ajuda', href: '#/ajuda' },
    ],
  },
  {
    label: 'Para clientes',
    links: [{ title: 'Buscar produtos', href: '#/produtos' }],
  },
  { label: 'Blog', href: '#/blog' },
];

const open = async (el: HTMLElement) => {
  el.querySelector<HTMLButtonElement>('.rds-navmenu__trigger')!.focus();
  await userEvent.keyboard('{Enter}');
  await settle();
};

describe.each(MODES)('NavigationMenu (%s)', (mode) => {
  it('closed, and with a panel open, passes axe', async () => {
    const el = await render(<NavigationMenu aria-label="Principal" items={ITEMS} />, mode);
    expect(await axeViolations(el)).toEqual([]);
    await open(el);
    expect(el.querySelector('.rds-navmenu__panel')).not.toBeNull();
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('NavigationMenu behaviour', () => {
  it('the link title (navmenu/link/title → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<NavigationMenu aria-label="Principal" items={ITEMS} />, 'light');
    await open(el);
    expect(await axeViolations(el)).toEqual([]);
  });

  it('by keyboard: Enter opens, the arrows go between items and into the panel, Esc closes and returns the focus', async () => {
    const el = await render(<NavigationMenu aria-label="Principal" items={ITEMS} />);
    expect(el.querySelector('nav')!.getAttribute('aria-label')).toBe('Principal');
    const [lojas, clientes] = [...el.querySelectorAll<HTMLButtonElement>('button.rds-navmenu__trigger')];
    expect(lojas!.getAttribute('aria-expanded')).toBe('false');

    await open(el);
    expect(lojas!.getAttribute('aria-expanded')).toBe('true');
    // Into the panel: Tab (or the down arrow) reaches the first link.
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement!.getAttribute('href')).toBe('#/vender');
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement!.getAttribute('href')).toBe('#/planos');

    await userEvent.keyboard('{Escape}');
    await settle();
    expect(lojas!.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(lojas);

    // Between the items: the arrows, then the plain link.
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(clientes);
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement!.getAttribute('href')).toBe('#/blog');
  });
});
