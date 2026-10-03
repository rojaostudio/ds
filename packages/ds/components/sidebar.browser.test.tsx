import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { page, userEvent } from 'vitest/browser';
import { CalendarIcon, InfoIcon, SearchIcon, TableIcon, UserIcon } from './internal/icons';
import { Sidebar, SidebarItem, SidebarSection, SidebarSeparator, type SidebarProps } from './sidebar';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

// In dark, sidebar/item/label/active (colors/primary/default) over sidebar/item/background/active (surface/tint/default)
// measured 3.36:1 while the rojao theme came from the generator (an orange tint). The theme is the Figma table now
// (blue/800 tint) and the pair passes: nothing is kept out of the matrix any more.

function Example(props: Partial<SidebarProps>) {
  return (
    <Sidebar module="Pedidos" user="Ana Lima" footer={<SidebarItem icon={<UserIcon />}>Sair</SidebarItem>} {...props}>
      <SidebarItem icon={<InfoIcon />} href="#/painel" current>
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
  it('open and collapsed, on the page and on the brand plate, with sections, count, user and foot, pass axe', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 16, height: 640 }}>
        <Example aria-label="Navegação clara" />
        <div className="ds-plate" style={{ background: 'var(--surface-page)' }}>
          <Example aria-label="Navegação na placa da marca" />
        </div>
        <Example aria-label="Navegação recolhida" collapsed />
        <Example aria-label="Navegação com logo" header="logo" logo={<span>Produto</span>} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Sidebar behaviour', () => {
  it('the module (sidebar/module → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<Example />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the current entry (sidebar/item/label/active on background/active) passes axe on the rojao dark theme', async () => {
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

  it.each(MODES)('the current entry with a count (sidebar/item/count on the tint) passes axe (%s)', async (mode) => {
    const el = await render(
      <Sidebar module="Pedidos">
        <SidebarItem icon={<InfoIcon />} href="#/painel" current count={2}>
          Painel
        </SidebarItem>
      </Sidebar>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the current entry: label 600 in sidebar/item/label/active and the 3 × 20 marker in sidebar/item/indicator', async () => {
    for (const mode of MODES) {
      const el = await render(<Example />, mode);
      const current = el.querySelector<HTMLElement>('[aria-current="page"]')!;
      const other = el.querySelector<HTMLElement>('a[href="#/agenda"]')!;
      expect(getComputedStyle(current.querySelector('.rds-sidebar__label')!).fontWeight).toBe('600');
      expect(getComputedStyle(other.querySelector('.rds-sidebar__label')!).fontWeight).toBe('500');
      const probe = document.createElement('span');
      current.append(probe);
      probe.style.color = 'var(--sidebar-item-indicator)';
      const indicator = getComputedStyle(probe).color;
      probe.style.color = 'var(--sidebar-item-label-active)';
      const label = getComputedStyle(probe).color;
      probe.remove();
      expect(getComputedStyle(current).color).toBe(label);
      const mark = getComputedStyle(current, '::before');
      expect([mark.width, mark.height, mark.backgroundColor]).toEqual(['3px', '20px', indicator]);
      expect(getComputedStyle(other, '::before').content).toBe('none');
      cleanup();
    }
  });
});

describe('Sidebar vocabulary', () => {
  it('the deprecated active is current', async () => {
    const el = await render(
      <Sidebar>
        <SidebarItem icon={<InfoIcon />} href="#/a" active>
          Painel
        </SidebarItem>
      </Sidebar>,
    );
    expect(el.querySelector('a')!.getAttribute('aria-current')).toBe('page');
  });
});
