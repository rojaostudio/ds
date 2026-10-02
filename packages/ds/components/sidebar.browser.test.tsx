import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { page, userEvent } from 'vitest/browser';
import { CalendarIcon, InfoIcon, SearchIcon, TableIcon, UserIcon } from './internal/icons';
import { Sidebar, SidebarItem, SidebarSection, SidebarSeparator, type SidebarProps } from './sidebar';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

// [RDS] maps sidebar/module to text/heading, flare on the rojao light theme (2.9:1 on white): a violation of the Figma
// itself, as in item.browser.test.tsx. Kept out of the light matrix and pinned with it.fails.
// In dark, sidebar/item/label/active (colors/primary/default) over sidebar/item/background/active (surface/tint/default)
// measures 3.36:1 on the rojao theme: also the Figma's. Pinned the same way.
const KNOWN = (mode: string) =>
  mode === 'light' ? ['.rds-sidebar:not(.rds-sidebar--dark) .rds-sidebar__module'] : ['.rds-sidebar__item[aria-current="page"]'];

function Example(props: Partial<SidebarProps>) {
  return (
    <Sidebar module="Pedidos" user="Ana Lima" footer={<SidebarItem icon={<UserIcon />}>Sair</SidebarItem>} {...props}>
      <SidebarItem icon={<InfoIcon />} href="#/painel" active>
        Painel
      </SidebarItem>
      <SidebarItem icon={<CalendarIcon />} href="#/agenda" count={6}>
        Agenda
      </SidebarItem>
      <SidebarSeparator />
      <SidebarSection label="Cadastros" count={3}>
        <SidebarItem icon={<TableIcon />} asChild>
          <a href="#/clientes">Clientes</a>
        </SidebarItem>
        <SidebarItem icon={<SearchIcon />} href="#/busca">
          Busca
        </SidebarItem>
      </SidebarSection>
    </Sidebar>
  );
}

describe.each(MODES)('Sidebar (%s)', (mode) => {
  it('light and dark, open and collapsed, with sections, count, user and foot, pass axe', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 16, height: 640 }}>
        <Example aria-label="Navegação clara" />
        <Example aria-label="Navegação escura" tone="dark" />
        <Example aria-label="Navegação recolhida" collapsed />
        <Example aria-label="Navegação com logo" header="logo" logo={<span>Produto</span>} />
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN(mode))).toEqual([]);
  });
});

describe('Sidebar behaviour', () => {
  it.fails('the module (sidebar/module → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<Example />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it.fails('the current entry (sidebar/item/label/active on background/active) passes axe on the rojao dark theme', async () => {
    const el = await render(<Example />, 'dark');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('a named nav with a list; the current entry has aria-current; asChild takes a framework link', async () => {
    const el = await render(<Example />);
    const nav = el.querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('Navegação principal');
    expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(nav.querySelector('[aria-current="page"]')!.textContent).toBe('Painel');
    const clientes = nav.querySelector<HTMLAnchorElement>('a[href="#/clientes"]')!;
    expect(clientes.className).toContain('rds-sidebar__item');
    expect(clientes.querySelector('.rds-sidebar__label')!.textContent).toBe('Clientes');
    // The default mark: a brand Avatar with the module's initial, decorative next to the module's name.
    expect(nav.querySelector('.rds-sidebar__mark')!.getAttribute('aria-hidden')).toBe('true');
    expect(nav.querySelector('.rds-sidebar__mark')!.textContent).toBe('P');
  });

  it('the section label is the Figma .sidebar/section type: 11/14 bold, caps, 6% tracking', async () => {
    const el = await render(<Example />);
    const label = el.querySelector<HTMLElement>('.rds-sidebar__section-label')!;
    const s = getComputedStyle(label);
    expect(s.textTransform).toBe('uppercase');
    expect(s.fontSize).toBe('11px');
    expect(s.lineHeight).toBe('14px');
    expect(s.fontWeight).toBe('700');
    expect(parseFloat(s.letterSpacing)).toBeCloseTo(0.66, 1);
  });

  it('a section opens and closes; closed, it shows its count', async () => {
    const el = await render(<Example />);
    const toggle = el.querySelector<HTMLButtonElement>('.rds-sidebar__section-toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.querySelector('.rds-sidebar__section-count')).toBeNull();
    await act(async () => toggle.click());
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById(toggle.getAttribute('aria-controls')!)!.hidden).toBe(true);
    expect(toggle.textContent).toContain('3');
  });

  it('collapsed: every entry keeps its accessible name, and shows it in a Tooltip on focus', async () => {
    const el = await render(<Example collapsed />);
    expect(el.querySelector('nav')!.getBoundingClientRect().width).toBe(64);
    for (const name of ['Painel', 'Agenda', 'Clientes', 'Busca']) {
      await expect.element(page.getByRole('link', { name, exact: true })).toBeInTheDocument();
    }
    await expect.element(page.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
    // The count does not show; the section's entries stay in a list named by the section.
    expect(el.querySelector('.rds-sidebar__count')).toBeNull();
    await expect.element(page.getByRole('list', { name: 'Cadastros' })).toBeInTheDocument();
    // Module and user leave the screen but stay for screen readers.
    expect(el.querySelector('.rds-visually-hidden')!.textContent).toBe('Pedidos');
    el.querySelector<HTMLElement>('a[href="#/painel"]')!.focus();
    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await settle();
    await expect.element(page.getByRole('tooltip')).toHaveTextContent('Painel');
  });
});
