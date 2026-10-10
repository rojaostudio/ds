import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, useState } from 'react';
import { page, userEvent } from 'vitest/browser';
import { CalendarIcon, InfoIcon, SearchIcon, TableIcon, UserIcon } from './internal/icons';
import { Sidebar, SidebarGroup, SidebarItem, SidebarTrigger, type SidebarProps } from './sidebar';
import { MODES, SCHEMES, axeViolations, cleanup, render, renderIn, settle } from './__tests__/render';

afterEach(cleanup);
// The Sidebar is in view from lg (1024); below it, the drawer.
beforeEach(async () => {
  await page.viewport(1280, 900);
});

const colour = (host: Element, v: string) => {
  const probe = document.createElement('span');
  host.append(probe);
  probe.style.color = `var(${v})`;
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c;
};

function Example(props: Partial<SidebarProps>) {
  return (
    <Sidebar
      module="Pedidos"
      user="Ana Lima"
      currentPath="/financeiro/contas"
      footer={<SidebarItem icon={<UserIcon />}>Sair</SidebarItem>}
      {...props}
    >
      <SidebarItem icon={<InfoIcon />} href="/painel">
        Painel
      </SidebarItem>
      <SidebarItem icon={<CalendarIcon />} href="/agenda" count={6} countLabel="na fila">
        Agenda
      </SidebarItem>
      <SidebarGroup label="Cadastros" icon={<TableIcon />}>
        <SidebarItem asChild>
          <a href="/clientes">Clientes</a>
        </SidebarItem>
        <SidebarItem href="/busca" count={2}>
          Busca
        </SidebarItem>
      </SidebarGroup>
      <SidebarGroup label="Financeiro" icon={<SearchIcon />}>
        <SidebarItem href="/financeiro">Resumo</SidebarItem>
        <SidebarItem href="/financeiro/contas" count={3} countTone="danger" countLabel="vencidos">
          Contas a pagar
        </SidebarItem>
      </SidebarGroup>
    </Sidebar>
  );
}

describe.each(SCHEMES)('Sidebar (%s)', (scheme) => {
  it('open with groups, counts, the current page, user and foot, and the logo header, passes axe', async () => {
    const el = await renderIn(
      <div style={{ display: 'flex', gap: 16, height: 720 }}>
        <Example aria-label="Navegação aberta" />
        <Example aria-label="Navegação com logo" header="logo" logo={<span>Produto</span>} />
      </div>,
      scheme,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the rail, with dots and a flyout open, passes axe', async () => {
    const el = await renderIn(
      <div style={{ height: 720 }}>
        <Example aria-label="Navegação recolhida" collapsed />
      </div>,
      scheme,
    );
    await act(async () => el.querySelector<HTMLButtonElement>('button[aria-label^="Financeiro"]')!.focus());
    expect(el.querySelector('.rds-sidebar__flyout:not([hidden])')).not.toBeNull();
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Sidebar logo header', () => {
  const logo = (w: number, h: number) =>
    `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}"/></svg>`)}`;

  it('64 tall; the logo keeps its proportion, up to 48 tall and never wider than the header', async () => {
    const el = await render(
      <div>
        <Sidebar aria-label="A" header="logo" logo={<img src={logo(234, 85)} alt="Rojão" />}>{null}</Sidebar>
        <Sidebar aria-label="B" header="logo" logo={<img src={logo(1128, 144)} alt="Acassius" />}>{null}</Sidebar>
      </div>,
    );
    await vi.waitFor(() => expect([...el.querySelectorAll('img')].every((i) => i.complete)).toBe(true));
    const [a, b] = [...el.querySelectorAll<HTMLElement>('.rds-sidebar__header')];
    expect(a.getBoundingClientRect().height).toBe(64);
    const [ia, ib] = [...el.querySelectorAll('img')].map((i) => i.getBoundingClientRect());
    expect(ia.height).toBeCloseTo(48, 0);
    expect(ia.width / ia.height).toBeCloseTo(234 / 85, 1);
    const room = b.clientWidth - parseFloat(getComputedStyle(b).paddingLeft) - parseFloat(getComputedStyle(b).paddingRight);
    expect(ib.width).toBeLessThanOrEqual(room);
    expect(ib.height).toBeLessThan(48);
    expect(ib.width / ib.height).toBeCloseTo(1128 / 144, 1);
  });

  it('the product sets the width: an <img width={100}> stays 100, in proportion', async () => {
    const el = await render(<Sidebar aria-label="C" header="logo" logo={<img src={logo(1128, 144)} width={100} alt="Acassius" />}>{null}</Sidebar>);
    await vi.waitFor(() => expect(el.querySelector('img')!.complete).toBe(true));
    const box = el.querySelector('img')!.getBoundingClientRect();
    expect(box.width).toBe(100);
    expect(box.height).toBeCloseTo(100 * 144 / 1128, 0);
  });
});

describe('Sidebar levels', () => {
  it('level 1 (loose entry and group header): 44 tall, 12 inside, icon 20, 14/20 medium in label/default', async () => {
    const el = await render(<Example />);
    const loose = el.querySelector<HTMLElement>('a[href="/painel"]')!;
    const header = el.querySelector<HTMLElement>('.rds-sidebar__group-toggle')!;
    for (const entry of [loose, header]) {
      const s = getComputedStyle(entry);
      expect(entry.getBoundingClientRect().height).toBe(44);
      expect(s.paddingLeft).toBe('12px');
      expect([s.fontSize, s.lineHeight]).toEqual(['14px', '20px']);
      expect(getComputedStyle(entry.querySelector('.rds-sidebar__label')!).fontWeight).toBe('500');
      expect(entry.querySelector('.rds-sidebar__icon svg')!.getBoundingClientRect().width).toBe(20);
    }
    expect(getComputedStyle(loose).color).toBe(colour(loose, '--sidebar-item-label-default'));
    expect(header.querySelector('.rds-sidebar__chevron svg')!.getBoundingClientRect().width).toBe(14);
  });

  it('level 2 (inside a group): text only, 40 tall, indented 44, regular; the level comes from the position', async () => {
    const el = await render(
      <Sidebar currentPath="/x">
        <SidebarItem href="/solta">Solta, sem ícone</SidebarItem>
        <SidebarGroup label="Grupo" icon={<TableIcon />}>
          <SidebarItem href="/sub" icon={<InfoIcon />}>
            Sub com ícone
          </SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    await act(async () => el.querySelector<HTMLButtonElement>('.rds-sidebar__group-toggle')!.click());
    const loose = el.querySelector<HTMLElement>('a[href="/solta"]')!;
    const sub = el.querySelector<HTMLElement>('a[href="/sub"]')!;
    // Level by position, never by having children or an icon.
    expect(loose.className).toContain('rds-sidebar__item--level-1');
    expect(loose.getBoundingClientRect().height).toBe(44);
    expect(sub.className).toContain('rds-sidebar__item--level-2');
    expect(sub.querySelector('.rds-sidebar__icon')).toBeNull();
    expect(sub.getBoundingClientRect().height).toBe(40);
    expect(getComputedStyle(sub).paddingLeft).toBe('44px');
    expect(getComputedStyle(sub.querySelector('.rds-sidebar__label')!).fontWeight).toBe('400');
  });

  it('the current page has the pill and a semibold label; its group header is strong text, semibold, no pill', async () => {
    for (const mode of MODES) {
      const el = await render(<Example />, mode);
      const current = el.querySelector<HTMLElement>('[aria-current="page"]')!;
      expect(current.getAttribute('href')).toBe('/financeiro/contas');
      expect(getComputedStyle(current).backgroundColor).toBe(colour(current, '--sidebar-item-background-active'));
      expect(getComputedStyle(current).color).toBe(colour(current, '--sidebar-item-label-active'));
      expect(getComputedStyle(current.querySelector('.rds-sidebar__label')!).fontWeight).toBe('600');
      const group = el.querySelector<HTMLElement>('.rds-sidebar__group-toggle--current')!;
      expect(group.textContent).toBe('Financeiro');
      expect(getComputedStyle(group).color).toBe(colour(group, '--sidebar-item-label-strong'));
      expect(getComputedStyle(group.querySelector('.rds-sidebar__label')!).fontWeight).toBe('600');
      expect(getComputedStyle(group).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      // No marker any more.
      expect(getComputedStyle(current, '::before').content).toBe('none');
      cleanup();
    }
  });

  it('the count: the number on the right in sidebar/count, said in the name; a group header never shows one', async () => {
    const el = await render(<Example />);
    const agenda = el.querySelector<HTMLElement>('a[href="/agenda"]')!;
    const count = agenda.querySelector('.rds-sidebar__count')!;
    expect(count.textContent).toBe('6');
    expect(getComputedStyle(count).color).toBe(colour(agenda, '--sidebar-count-neutral'));
    await expect.element(page.getByRole('link', { name: 'Agenda, 6 na fila' })).toBeInTheDocument();
    const contas = el.querySelector<HTMLElement>('a[href="/financeiro/contas"] .rds-sidebar__count')!;
    expect(getComputedStyle(contas).color).toBe(colour(el, '--sidebar-count-danger'));
    for (const header of el.querySelectorAll('.rds-sidebar__group-toggle')) {
      expect(header.querySelector('.rds-sidebar__count, .rds-sidebar__dot')).toBeNull();
      expect(header.textContent).not.toMatch(/\d/);
    }
  });
});

describe('Sidebar current page and accordion', () => {
  it('one aria-current only: the longest matching href wins, also over an entry marked current', async () => {
    const el = await render(
      <Sidebar currentPath="/financeiro/contas/123">
        <SidebarItem icon={<InfoIcon />} href="/" current>
          Início
        </SidebarItem>
        <SidebarGroup label="Financeiro" icon={<SearchIcon />}>
          <SidebarItem href="/financeiro">Resumo</SidebarItem>
          <SidebarItem href="/financeiro/contas">Contas</SidebarItem>
          <SidebarItem href="/financeiro/contas-antigas">Antigas</SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
    const marked = el.querySelectorAll('[aria-current="page"]');
    expect(marked).toHaveLength(1);
    expect(marked[0].getAttribute('href')).toBe('/financeiro/contas');
  });

  it('the group of the current route opens; the groups are exclusive; the open one closes on its own button', async () => {
    const el = await render(<Example />);
    const [cadastros, financeiro] = el.querySelectorAll<HTMLButtonElement>('.rds-sidebar__group-toggle');
    const list = (b: HTMLButtonElement) => document.getElementById(b.getAttribute('aria-controls')!)!;
    expect(financeiro.getAttribute('aria-expanded')).toBe('true');
    expect(cadastros.getAttribute('aria-expanded')).toBe('false');
    expect(list(cadastros).hidden).toBe(true);
    await act(async () => cadastros.click());
    expect(cadastros.getAttribute('aria-expanded')).toBe('true');
    expect(financeiro.getAttribute('aria-expanded')).toBe('false');
    expect(list(financeiro).hidden).toBe(true);
    await act(async () => cadastros.click());
    expect(cadastros.getAttribute('aria-expanded')).toBe('false');
    expect(financeiro.getAttribute('aria-expanded')).toBe('false');
  });

  it('a named nav with a list; asChild takes a framework link; the default mark is decorative', async () => {
    const el = await render(<Example />);
    const nav = el.querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('Navegação principal');
    expect(nav.querySelector(':scope > ul')).not.toBeNull();
    const clientes = nav.querySelector<HTMLAnchorElement>('a[href="/clientes"]')!;
    expect(clientes.className).toContain('rds-sidebar__item');
    expect(clientes.querySelector('.rds-sidebar__label')!.textContent).toBe('Clientes');
    expect(nav.querySelector('.rds-sidebar__mark')!.getAttribute('aria-hidden')).toBe('true');
    expect(nav.querySelector('.rds-sidebar__mark')!.textContent).toBe('P');
  });
});

describe('Sidebar rail', () => {
  it('64 wide: the loose entries and one icon per group, each named, with a dot in the worst state', async () => {
    const el = await render(<Example collapsed />);
    expect(el.querySelector('nav')!.getBoundingClientRect().width).toBe(64);
    for (const name of ['Painel', 'Agenda, 6 na fila']) {
      await expect.element(page.getByRole('link', { name, exact: true })).toBeInTheDocument();
    }
    // The groups' entries are not in view until the flyout opens.
    expect(el.querySelector('a[href="/clientes"]')!.closest('[hidden]')).not.toBeNull();
    const cadastros = el.querySelector<HTMLButtonElement>('button[aria-label="Cadastros, 2"]')!;
    const financeiro = el.querySelector<HTMLButtonElement>('button[aria-label="Financeiro, 3 vencidos"]')!;
    expect(cadastros.querySelector('.rds-sidebar__dot--neutral')).not.toBeNull();
    expect(financeiro.querySelector('.rds-sidebar__dot--danger')).not.toBeNull();
    const dot = financeiro.querySelector<HTMLElement>('.rds-sidebar__dot')!;
    expect(dot.getBoundingClientRect().width).toBe(8);
    expect(getComputedStyle(dot).backgroundColor).toBe(colour(dot, '--sidebar-dot-danger'));
    // The loose entry's count is a dot too, never a number.
    expect(el.querySelector('a[href="/agenda"] .rds-sidebar__dot--neutral')).not.toBeNull();
    expect(el.querySelector('a[href="/agenda"] .rds-sidebar__count')).toBeNull();
    // The current group has the soft fill in the rail.
    expect(getComputedStyle(financeiro).backgroundColor).toBe(colour(financeiro, '--sidebar-item-background-active'));
  });

  it('the flyout opens on focus without moving the focus; Enter, Space and → go in; Esc closes and gives it back', async () => {
    const el = await render(<Example collapsed />);
    const button = el.querySelector<HTMLButtonElement>('button[aria-label^="Cadastros"]')!;
    const flyout = el.querySelector<HTMLElement>(`#${CSS.escape(button.getAttribute('aria-controls')!)}`)!.closest('.rds-sidebar__flyout')!;
    el.querySelector<HTMLElement>('a[href="/agenda"]')!.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(flyout.hasAttribute('hidden')).toBe(false);
    expect(flyout.className).toContain('rds-menu');
    expect(flyout.getBoundingClientRect().width).toBe(240);
    for (const key of ['{Enter}', ' ', '{ArrowRight}']) {
      button.focus();
      await userEvent.keyboard(key);
      await settle();
      expect(document.activeElement!.getAttribute('href')).toBe('/clientes');
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement!.getAttribute('href')).toBe('/busca');
      await userEvent.keyboard('{Escape}');
      expect(document.activeElement).toBe(button);
      expect(flyout.hasAttribute('hidden')).toBe(true);
    }
  });

  it('a click opens and closes the flyout; a click outside closes it', async () => {
    const el = await render(<Example collapsed />);
    const button = el.querySelector<HTMLButtonElement>('button[aria-label^="Financeiro"]')!;
    await userEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    await userEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(button);
    await userEvent.click(document.body);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('a loose entry shows its name in a Tooltip on focus', async () => {
    const el = await render(<Example collapsed />);
    el.querySelector<HTMLElement>('a[href="/painel"]')!.focus();
    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await settle();
    await expect.element(page.getByRole('tooltip')).toHaveTextContent('Painel');
  });
});

function Caixa(props: Partial<SidebarProps> & { open?: boolean }) {
  const { open = true, ...rest } = props;
  return (
    <Sidebar module="Loja" currentPath="/painel" {...rest}>
      <SidebarItem icon={<InfoIcon />} href="/painel">
        Painel
      </SidebarItem>
      <SidebarItem icon={<CalendarIcon />} href="/caixa" status={open ? { tone: 'success', label: 'aberto' } : { tone: 'danger', label: 'fechado' }}>
        Caixa
      </SidebarItem>
    </Sidebar>
  );
}

describe.each(SCHEMES)('Sidebar item status (%s)', (scheme) => {
  it('open and in the rail, aberto and fechado, passes axe', async () => {
    const el = await renderIn(
      <div style={{ display: 'flex', gap: 16, height: 400 }}>
        <Caixa aria-label="Aberta, caixa aberto" />
        <Caixa aria-label="Aberta, caixa fechado" open={false} />
        <Caixa aria-label="Recolhida, caixa aberto" collapsed />
        <Caixa aria-label="Recolhida, caixa fechado" collapsed open={false} />
      </div>,
      scheme,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Sidebar item status', () => {
  it('open: a Status sm on the right in the tone, no count; the label joins the name', async () => {
    const el = await render(<Caixa />);
    await expect.element(page.getByRole('link', { name: 'Caixa, aberto', exact: true })).toBeInTheDocument();
    const entry = el.querySelector<HTMLElement>('a[href="/caixa"]')!;
    const status = entry.querySelector<HTMLElement>('.rds-sidebar__status')!;
    expect(status.classList).toContain('rds-status--sm');
    expect(status.classList).toContain('rds-status--success-outline');
    expect(status.textContent).toBe('aberto');
    expect(status.getAttribute('aria-hidden')).toBe('true');
    expect(status.getBoundingClientRect().height).toBe(24);
    // On the right: after the label, flush with the entry's end (12 inside).
    const label = entry.querySelector<HTMLElement>('.rds-sidebar__label')!;
    expect(status.getBoundingClientRect().left).toBeGreaterThanOrEqual(label.getBoundingClientRect().right);
    expect(Math.round(entry.getBoundingClientRect().right - status.getBoundingClientRect().right)).toBe(12);
    expect(entry.querySelector('.rds-sidebar__count')).toBeNull();
    expect(entry.querySelector('.rds-sidebar__dot')).toBeNull();

    cleanup();
    const closed = await render(<Caixa open={false} />);
    await expect.element(page.getByRole('link', { name: 'Caixa, fechado', exact: true })).toBeInTheDocument();
    expect(closed.querySelector('.rds-sidebar__status')!.classList).toContain('rds-status--danger-outline');
  });

  it('in the rail: an 8 dot in the icon corner in the tone colour, no Status; the name keeps the label', async () => {
    for (const [open, tone, label] of [
      [true, 'success', 'aberto'],
      [false, 'danger', 'fechado'],
    ] as const) {
      cleanup();
      const el = await render(<Caixa collapsed open={open} />);
      await expect.element(page.getByRole('link', { name: `Caixa, ${label}`, exact: true })).toBeInTheDocument();
      const entry = el.querySelector<HTMLElement>('a[href="/caixa"]')!;
      expect(entry.querySelector('.rds-sidebar__status')).toBeNull();
      const dot = entry.querySelector<HTMLElement>(`.rds-sidebar__icon .rds-sidebar__dot--${tone}`)!;
      expect(dot.getBoundingClientRect().width).toBe(8);
      expect(getComputedStyle(dot).backgroundColor).toBe(colour(dot, `--sidebar-dot-${tone}`));
    }
  });

  it('every Status tone has its dot colour', async () => {
    const tones = ['neutral', 'info', 'success', 'warning', 'danger'] as const;
    const el = await render(
      <Sidebar collapsed>
        {tones.map((tone) => (
          <SidebarItem key={tone} icon={<InfoIcon />} href={`/${tone}`} status={{ tone, label: tone }}>
            {tone}
          </SidebarItem>
        ))}
      </Sidebar>,
    );
    const seen = new Set<string>();
    for (const tone of tones) {
      const dot = el.querySelector<HTMLElement>(`a[href="/${tone}"] .rds-sidebar__dot`)!;
      const bg = getComputedStyle(dot).backgroundColor;
      expect(bg).not.toBe('rgba(0, 0, 0, 0)');
      seen.add(bg);
    }
    expect(seen.size).toBe(tones.length);
  });

  it('is exclusive with the count (types)', () => {
    const both = (
      // @ts-expect-error: a state and a count do not go together.
      <SidebarItem status={{ tone: 'success', label: 'aberto' }} count={3}>
        Caixa
      </SidebarItem>
    );
    expect(both).toBeTruthy();
  });
});

describe('Sidebar rail takes the open Sidebar entries', () => {
  // #53 item 1: the same children, open and collapsed; nothing fixed in the rail.
  const names = (el: HTMLElement) =>
    [...el.querySelectorAll<HTMLElement>('nav > ul > li > a, nav > ul > li > button, nav > ul > li > .rds-sidebar__group-toggle, .rds-sidebar__account a, .rds-sidebar__account button')].map(
      (e) => e.getAttribute('aria-label') ?? e.textContent,
    );

  it('the loose entries, one button per group and the foot, each with its name; the groups entries in the flyout', async () => {
    const entries = (
      <>
        <SidebarItem icon={<InfoIcon />} href="/painel">
          Painel
        </SidebarItem>
        <SidebarItem icon={<CalendarIcon />} href="/caixa" status={{ tone: 'success', label: 'aberto' }}>
          Caixa
        </SidebarItem>
        <SidebarGroup label="Financeiro" icon={<SearchIcon />}>
          <SidebarItem href="/financeiro/contas" count={3} countTone="danger" countLabel="vencidos">
            Contas a pagar
          </SidebarItem>
        </SidebarGroup>
      </>
    );
    const footer = <SidebarItem icon={<UserIcon />}>Sair</SidebarItem>;
    const open = await render(
      <Sidebar module="Loja" footer={footer}>
        {entries}
      </Sidebar>,
    );
    const openNames = names(open);
    cleanup();
    const el = await render(
      <Sidebar module="Loja" footer={footer} collapsed>
        {entries}
      </Sidebar>,
    );
    expect(names(el)).toEqual(['Painel', 'Caixa, aberto', 'Financeiro, 3 vencidos', 'Sair']);
    expect(openNames).toEqual(['Painel', 'Caixa, aberto', 'Financeiro', 'Sair']);
    // Each rail entry is an icon only (44 square), its label in the Tooltip.
    for (const entry of el.querySelectorAll<HTMLElement>('.rds-sidebar__item--level-1')) {
      expect(entry.getBoundingClientRect().width).toBe(44);
    }
    expect(el.querySelector('.rds-sidebar__flyout a[href="/financeiro/contas"]')).not.toBeNull();
    el.querySelector<HTMLElement>('a[href="/painel"]')!.focus();
    await userEvent.keyboard('{Tab}');
    await settle();
    await expect.element(page.getByRole('tooltip')).toHaveTextContent('Caixa');
  });
});

describe('Sidebar account entry', () => {
  // #53 item 3: the entry of the account block is the product's (icon, label, href, current), through `footer`.
  const Plano = (props: Partial<SidebarProps>) => (
    <Sidebar
      module="Loja"
      user="Ana Lima"
      footer={
        <SidebarItem icon={<CalendarIcon />} href="/billing">
          Plano e consumo
        </SidebarItem>
      }
      {...props}
    >
      <SidebarItem icon={<InfoIcon />} href="/painel">
        Painel
      </SidebarItem>
    </Sidebar>
  );

  it('takes its icon, label and href; the route makes it the current page, the only one', async () => {
    const el = await render(<Plano currentPath="/billing/consumo" />);
    const entry = el.querySelector<HTMLElement>('.rds-sidebar__account a[href="/billing"]')!;
    expect(entry.textContent).toBe('Plano e consumo');
    expect(entry.querySelector('.rds-sidebar__icon svg')).not.toBeNull();
    expect(entry.getAttribute('aria-current')).toBe('page');
    expect(el.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(getComputedStyle(entry).backgroundColor).toBe(colour(entry, '--sidebar-item-background-active'));
  });

  it('its own `current` counts when no href matches; in the rail it keeps its name and Tooltip', async () => {
    let el = await render(
      <Sidebar footer={<SidebarItem icon={<CalendarIcon />} current>Plano e consumo</SidebarItem>}>
        <SidebarItem icon={<InfoIcon />} href="/painel">
          Painel
        </SidebarItem>
      </Sidebar>,
    );
    expect(el.querySelector('.rds-sidebar__account button')!.getAttribute('aria-current')).toBe('page');
    cleanup();
    el = await render(<Plano collapsed currentPath="/billing" />);
    await expect.element(page.getByRole('link', { name: 'Plano e consumo', exact: true })).toHaveAttribute('aria-current', 'page');
    el.querySelector<HTMLElement>('a[href="/painel"]')!.focus();
    await userEvent.keyboard('{Tab}');
    await settle();
    await expect.element(page.getByRole('tooltip')).toHaveTextContent('Plano e consumo');
  });

  it('passes axe, open and in the rail', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 16, height: 400 }}>
        <Plano aria-label="Aberta" currentPath="/billing" />
        <Plano aria-label="Recolhida" currentPath="/billing" collapsed />
      </div>,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

function Drawer({ onChange }: { onChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const change = (next: boolean) => {
    setOpen(next);
    onChange?.(next);
  };
  return (
    <>
      <SidebarTrigger controls="menu" open={open} onOpenChange={change} />
      <Example id="menu" drawerOpen={open} onDrawerOpenChange={change} />
    </>
  );
}

describe('Sidebar drawer (below 1024)', () => {
  beforeEach(async () => {
    await page.viewport(390, 800);
  });

  it('closed it is inert and out of view; the trigger has aria-controls and aria-expanded', async () => {
    const el = await render(<Drawer />);
    const nav = el.querySelector('nav')!;
    const trigger = el.querySelector<HTMLButtonElement>('.rds-sidebar-trigger')!;
    expect(nav.hasAttribute('inert')).toBe(true);
    expect(getComputedStyle(nav).visibility).toBe('hidden');
    expect(trigger.getAttribute('aria-controls')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-label')).toBe('Menu');
  });

  it('opens with the focus inside, on the current page; Esc closes it and the focus goes back to the trigger', async () => {
    const onChange = vi.fn();
    const el = await render(<Drawer onChange={onChange} />);
    const trigger = el.querySelector<HTMLButtonElement>('.rds-sidebar-trigger')!;
    await userEvent.click(trigger);
    const nav = el.querySelector('nav')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(nav.hasAttribute('inert')).toBe(false);
    expect(getComputedStyle(nav).visibility).toBe('visible');
    expect(document.activeElement!.getAttribute('aria-current')).toBe('page');
    expect(await axeViolations(el)).toEqual([]);
    await userEvent.keyboard('{Escape}');
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(nav.hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it('the veil and an entry that navigates close it', async () => {
    const el = await render(<Drawer />);
    const trigger = el.querySelector<HTMLButtonElement>('.rds-sidebar-trigger')!;
    await userEvent.click(trigger);
    await act(async () => el.querySelector<HTMLElement>('.rds-sidebar__scrim')!.click());
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(trigger);
    const painel = el.querySelector<HTMLAnchorElement>('a[href="/painel"]')!;
    painel.addEventListener('click', (e) => e.preventDefault(), { once: true });
    await act(async () => painel.click());
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('the drawer opens whole even when collapsed is set (the rail is from 1024)', async () => {
    const el = await render(
      <Example id="menu" collapsed drawerOpen onDrawerOpenChange={() => {}} />,
    );
    expect(el.querySelector('nav')!.className).not.toContain('rds-sidebar--collapsed');
    expect(el.querySelector('nav')!.getBoundingClientRect().width).toBe(240);
  });
});

describe('Sidebar trigger from 1024', () => {
  it('is hidden where the Sidebar is in view', async () => {
    const el = await render(<Drawer />);
    expect(getComputedStyle(el.querySelector('.rds-sidebar-trigger')!).display).toBe('none');
    expect(el.querySelector('nav')!.hasAttribute('inert')).toBe(false);
  });
});
