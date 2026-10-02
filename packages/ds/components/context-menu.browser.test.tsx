import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from './context-menu';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

// The menu is portalled to the body, outside the test's <main>: the page-level landmark rule (region) does not
// apply to a floating layer; every other rule runs on the whole page (as in hover-card.browser.test.tsx).
const outsideRegion = (lines: string[]) => lines.filter((line) => !line.startsWith('region:'));
const menu = () => document.querySelector<HTMLElement>('[role="menu"]');

function Example({ onSelect = () => {} }: { onSelect?: (action: string) => void }) {
  return (
    <ContextMenu
      aria-label="Ações do arquivo"
      items={
        <>
          <ContextMenuItem shortcut="Ctrl C" onSelect={() => onSelect('copiar')}>
            Copiar
          </ContextMenuItem>
          <ContextMenuItem disabled onSelect={() => onSelect('colar')}>
            Colar
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => onSelect('renomear')}>Renomear</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem tone="danger" onSelect={() => onSelect('excluir')}>
            Excluir
          </ContextMenuItem>
        </>
      }
    >
      <div tabIndex={0} style={{ padding: 32 }} aria-label="relatorio.pdf">
        relatorio.pdf
      </div>
    </ContextMenu>
  );
}

const area = (el: HTMLElement) => el.querySelector<HTMLElement>('[tabindex="0"]')!;

describe.each(MODES)('ContextMenu (%s)', (mode) => {
  it('open passes axe', async () => {
    const el = await render(<Example />, mode);
    await userEvent.click(area(el), { button: 'right' });
    await vi.waitFor(() => expect(menu()).not.toBeNull());
    await settle();
    expect(outsideRegion(await axeViolations(document.body))).toEqual([]);
  });
});

describe('ContextMenu behaviour', () => {
  it('opens with the right click at the pointer; the arrows skip the disabled item; Enter chooses', async () => {
    const onSelect = vi.fn();
    const el = await render(<Example onSelect={onSelect} />);
    await userEvent.click(area(el), { button: 'right' });
    await vi.waitFor(() => expect(menu()).not.toBeNull());
    await vi.waitFor(() => expect(menu()!.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toContain('Copiar');
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toBe('Renomear');
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('renomear');
    await vi.waitFor(() => expect(menu()).toBeNull());
  });

  it.each([
    ['the menu key', '{ContextMenu}'],
    ['Shift+F10', '{Shift>}{F10}{/Shift}'],
  ])('opens from the keyboard with %s, and Escape closes giving the focus back', async (_, keys) => {
    const el = await render(<Example />);
    const target = area(el);
    target.focus();
    await userEvent.keyboard(keys);
    await vi.waitFor(() => expect(menu()).not.toBeNull());
    await vi.waitFor(() => expect(menu()!.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(menu()).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(target));
  });

  it('the disabled item does nothing and danger is marked', async () => {
    const onSelect = vi.fn();
    const el = await render(<Example onSelect={onSelect} />);
    await userEvent.click(area(el), { button: 'right' });
    await vi.waitFor(() => expect(menu()).not.toBeNull());
    const items = [...menu()!.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    expect(items[1].getAttribute('aria-disabled')).toBe('true');
    items[1].click();
    expect(onSelect).not.toHaveBeenCalled();
    expect(items[3].classList).toContain('rds-menu__item--danger');
  });

  it('disabled: the right click does not open it', async () => {
    const el = await render(
      <ContextMenu disabled items={<ContextMenuItem>Copiar</ContextMenuItem>}>
        <div tabIndex={0}>área</div>
      </ContextMenu>,
    );
    await userEvent.click(area(el), { button: 'right' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(menu()).toBeNull();
  });
});
