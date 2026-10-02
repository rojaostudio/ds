import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { useState } from 'react';
import { IconButton } from './icon-button';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from './dropdown-menu';
import { CheckIcon, MoreVerticalIcon } from './internal/icons';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

// The menu is portalled to the body, outside the test's <main>: the page-level landmark rule (region) does not
// apply to a floating layer; every other rule runs on the whole page (as in hover-card.browser.test.tsx).
const outsideRegion = (lines: string[]) => lines.filter((line) => !line.startsWith('region:'));
const menu = () => document.querySelector<HTMLElement>('[role="menu"]');
const items = () => [...menu()!.querySelectorAll<HTMLElement>('[role^="menuitem"]')];

function Example({ onSelect = () => {} }: { onSelect?: (action: string) => void }) {
  return (
    <DropdownMenu trigger={<IconButton icon={<MoreVerticalIcon />} label="Ações da campanha" tone="neutral" variant="ghost" />}>
      <DropdownMenuItem icon={<CheckIcon />} shortcut="Ctrl E" onSelect={() => onSelect('editar')}>
        Editar
      </DropdownMenuItem>
      <DropdownMenuItem disabled onSelect={() => onSelect('arquivar')}>
        Arquivar
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onSelect('duplicar')}>Duplicar</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem tone="danger" onSelect={() => onSelect('excluir')}>
        Excluir
      </DropdownMenuItem>
    </DropdownMenu>
  );
}

// Radix opens the menu on pointerdown, so a real click (not element.click()).
async function open(el: HTMLElement) {
  await userEvent.click(el.querySelector('button')!);
  await vi.waitFor(() => expect(menu()).not.toBeNull());
  await settle();
}

describe.each(MODES)('DropdownMenu (%s)', (mode) => {
  it('open, with icon, shortcut, disabled, separator and danger, passes axe', async () => {
    const el = await render(<Example />, mode);
    await open(el);
    expect(outsideRegion(await axeViolations(document.body))).toEqual([]);
  });

  it('open, with a radio group, passes axe', async () => {
    function Radio() {
      const [value, setValue] = useState('todos');
      return (
        <DropdownMenu trigger={<button type="button">Status</button>} aria-label="Status">
          <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
            <DropdownMenuRadioItem value="todos">Todos</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="ativos">Ativos</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenu>
      );
    }
    const el = await render(<Radio />, mode);
    await open(el);
    expect(outsideRegion(await axeViolations(document.body))).toEqual([]);
  });
});

describe('DropdownMenu behaviour', () => {
  it('opens from the keyboard on the first item; the arrows skip the disabled item; Enter chooses and gives the focus back', async () => {
    const onSelect = vi.fn();
    const el = await render(<Example onSelect={onSelect} />);
    const trigger = el.querySelector('button')!;
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(menu()).not.toBeNull());
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    await vi.waitFor(() => expect(document.activeElement?.textContent).toContain('Editar'));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toBe('Duplicar');
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toBe('Excluir');
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement?.textContent).toBe('Duplicar');
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('duplicar');
    await vi.waitFor(() => expect(menu()).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('Escape closes and gives the focus back to the trigger', async () => {
    const el = await render(<Example />);
    const trigger = el.querySelector('button')!;
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(menu()).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(menu()).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('the disabled item is aria-disabled and does nothing; danger is marked; the shortcut is not announced', async () => {
    const onSelect = vi.fn();
    const el = await render(<Example onSelect={onSelect} />);
    await open(el);
    const [editar, arquivar, , excluir] = items();
    expect(arquivar.getAttribute('aria-disabled')).toBe('true');
    arquivar.click();
    expect(onSelect).not.toHaveBeenCalled();
    expect(menu()).not.toBeNull();
    expect(excluir.classList).toContain('rds-menu__item--danger');
    expect(editar.querySelector('.rds-menu__shortcut')?.getAttribute('aria-hidden')).toBe('true');
    expect(menu()!.querySelector('[role="separator"]')).not.toBeNull();
  });

  it('a radio item is menuitemradio with aria-checked, and choosing one changes the value', async () => {
    function Radio() {
      const [value, setValue] = useState('todos');
      return (
        <>
          <output>{value}</output>
          <DropdownMenu trigger={<button type="button">Status</button>}>
            <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
              <DropdownMenuRadioItem value="todos">Todos</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="ativos">Ativos</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenu>
        </>
      );
    }
    const el = await render(<Radio />);
    await open(el);
    const [todos, ativos] = items();
    expect(todos.getAttribute('role')).toBe('menuitemradio');
    expect(todos.getAttribute('aria-checked')).toBe('true');
    expect(ativos.getAttribute('aria-checked')).toBe('false');
    ativos.click();
    await vi.waitFor(() => expect(el.querySelector('output')!.textContent).toBe('ativos'));
  });
});
