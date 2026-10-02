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
