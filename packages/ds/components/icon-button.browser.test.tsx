import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Alert } from './alert';
import { Calendar } from './calendar';
import { DropdownMenu, DropdownMenuItem } from './dropdown-menu';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

// #23: the [RDS] spec "Com Tooltip". IconButton and Tooltip are two components, always together: the Tooltip
// carries the same text as the IconButton's label, on hover and on keyboard focus.

const Plus = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
// The balloon is portalled to the body, outside the test's <main>: the page-level landmark rule (region) does not
// apply to a floating layer; every other rule runs on the whole page.
const outsideRegion = (lines: string[]) => lines.filter((line) => !line.startsWith('region:'));
const tip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

describe.each(MODES)('IconButton with Tooltip (%s)', (mode) => {
  it('opens on keyboard focus with the label text and passes axe', async () => {
    const el = await render(
      <div style={{ padding: 64 }}>
        <Tooltip text="Novo cliente">
          <IconButton icon={<Plus />} label="Novo cliente" />
        </Tooltip>
      </div>,
      mode,
    );
    const button = el.querySelector('button')!;
    await userEvent.tab();
    expect(document.activeElement).toBe(button);
    await vi.waitFor(() => expect(tip()).not.toBeNull());
    await settle();
    expect(tip()!.textContent).toBe(button.getAttribute('aria-label'));
    expect(document.getElementById(button.getAttribute('aria-describedby')!)?.textContent).toBe('Novo cliente');
    expect(outsideRegion(await axeViolations(document.body))).toEqual([]);
  });
});

describe('IconButton with Tooltip behaviour', () => {
  it('opens on hover, and the button keeps working', async () => {
    const onClick = vi.fn();
    const el = await render(
      <div style={{ padding: 64 }}>
        <Tooltip text="Novo cliente" delay={0}>
          <IconButton icon={<Plus />} label="Novo cliente" onClick={onClick} />
        </Tooltip>
      </div>,
    );
    const button = el.querySelector('button')!;
    await userEvent.hover(button);
    await vi.waitFor(() => expect(tip()?.textContent).toBe('Novo cliente'));
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('the pair can be the trigger of a DropdownMenu: the tooltip on focus, the menu on Enter', async () => {
    const el = await render(
      <div style={{ padding: 64 }}>
        <DropdownMenu
          trigger={
            <Tooltip text="Mais ações">
              <IconButton icon={<Plus />} label="Mais ações" tone="neutral" variant="ghost" />
            </Tooltip>
          }
        >
          <DropdownMenuItem>Editar</DropdownMenuItem>
        </DropdownMenu>
      </div>,
    );
    const button = el.querySelector('button')!;
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    await userEvent.tab();
    await vi.waitFor(() => expect(tip()?.textContent).toBe('Mais ações'));
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).not.toBeNull());
  });

  it('the IconButtons the design system renders come with their Tooltip (Alert close, Calendar arrows)', async () => {
    const el = await render(
      <div style={{ padding: 64, display: 'grid', gap: 16 }}>
        <Alert title="Salvo" onClose={() => {}} closeLabel="Fechar aviso" />
        <Calendar aria-label="Data" />
      </div>,
    );
    for (const label of ['Fechar aviso', 'Mês anterior', 'Próximo mês']) {
      const button = el.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
      button.focus();
      await vi.waitFor(() => expect(tip()?.textContent).toBe(label));
      await userEvent.keyboard('{Escape}');
      await vi.waitFor(() => expect(tip()).toBeNull());
    }
  });
});

// #53 item 5: the bell of a top bar, with the unread count in the corner.
describe.each(MODES)('IconButton count (%s)', (mode) => {
  it('the pill in every tone and variant passes axe', async () => {
    const el = await render(
      <div style={{ padding: 32, display: 'flex', gap: 24 }}>
        <IconButton icon={<Plus />} label="Notificações" count={3} countLabel="não lidas" tone="neutral" variant="ghost" />
        <IconButton icon={<Plus />} label="Pedidos" count={120} />
        <IconButton icon={<Plus />} label="Alertas" count={9} tone="danger" variant="outline" size="sm" />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('IconButton count', () => {
  const bell = (count?: number) => (
    <IconButton icon={<Plus />} label="Notificações" count={count} countLabel="não lidas" tone="neutral" variant="ghost" />
  );
  const pill = (el: HTMLElement) => el.querySelector<HTMLElement>('.rds-button__count');
  const colour = (host: Element, v: string) => {
    const probe = document.createElement('span');
    host.append(probe);
    probe.style.color = `var(${v})`;
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  };

  it('a danger pill in the top right corner; the number joins the name', async () => {
    const el = await render(<div style={{ padding: 32 }}>{bell(3)}</div>);
    const button = el.querySelector('button')!;
    expect(button.getAttribute('aria-label')).toBe('Notificações, 3 não lidas');
    const p = pill(el)!;
    expect(p.textContent).toBe('3');
    expect(p.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(p).backgroundColor).toBe(colour(p, '--icon-button-count-background'));
    expect(getComputedStyle(p).color).toBe(colour(p, '--icon-button-count-label'));
    const b = button.getBoundingClientRect();
    const r = p.getBoundingClientRect();
    // Over the corner: 4 past the top and the right edge, a 20 circle for one figure.
    expect(r.height).toBe(20);
    expect(r.width).toBe(20);
    expect(Math.round(b.top - r.top)).toBe(4);
    expect(Math.round(r.right - b.right)).toBe(4);
  });

  it('"99+" above 99, the real number in the name; without countLabel the name is "label, N"', async () => {
    let el = await render(bell(120));
    expect(pill(el)!.textContent).toBe('99+');
    expect(el.querySelector('button')!.getAttribute('aria-label')).toBe('Notificações, 120 não lidas');
    cleanup();
    el = await render(<IconButton icon={<Plus />} label="Notificações" count={99} />);
    expect(pill(el)!.textContent).toBe('99');
    expect(el.querySelector('button')!.getAttribute('aria-label')).toBe('Notificações, 99');
  });

  it('gone with 0 or undefined: no pill, the plain label', async () => {
    for (const count of [0, undefined]) {
      cleanup();
      const el = await render(bell(count));
      expect(pill(el)).toBeNull();
      expect(el.querySelector('button')!.getAttribute('aria-label')).toBe('Notificações');
    }
  });

  it('with asChild the link carries the pill and the counted name', async () => {
    const el = await render(
      <IconButton asChild icon={<Plus />} label="Notificações" count={5} countLabel="não lidas">
        <a href="/notificacoes" />
      </IconButton>,
    );
    const link = el.querySelector('a')!;
    expect(link.getAttribute('aria-label')).toBe('Notificações, 5 não lidas');
    expect(link.querySelector('.rds-button__count')!.textContent).toBe('5');
  });
});
