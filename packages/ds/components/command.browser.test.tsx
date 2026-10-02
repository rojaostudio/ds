import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Button } from './button';
import { Command, CommandGroup, CommandItem } from './command';
import { SearchIcon } from './internal/icons';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';
import { expectFocusTrapped, scrollLocked } from './__tests__/overlay';

afterEach(cleanup);

const palette = () => document.querySelector<HTMLElement>('.rds-command');
const input = () => palette()!.querySelector<HTMLInputElement>('input')!;
const options = () => [...palette()!.querySelectorAll<HTMLElement>('[role="option"]')];
const active = () => document.getElementById(input().getAttribute('aria-activedescendant') ?? '');

function Example({ onSelect = () => {} }: { onSelect?: (what: string) => void }) {
  return (
    <Command trigger={<Button variant="outline">Buscar</Button>}>
      <CommandGroup label="Ir para">
        <CommandItem icon={<SearchIcon />} onSelect={() => onSelect('campanhas')}>
          Campanhas
        </CommandItem>
        <CommandItem onSelect={() => onSelect('relatorios')}>Relatórios</CommandItem>
      </CommandGroup>
      <CommandGroup label="Ações">
        <CommandItem keywords={['envio', 'mensagem']} shortcut="Ctrl N" onSelect={() => onSelect('disparo')}>
          Novo disparo
        </CommandItem>
        <CommandItem disabled onSelect={() => onSelect('importar')}>
          Importar contatos
        </CommandItem>
      </CommandGroup>
    </Command>
  );
}

async function open(el: HTMLElement) {
  el.querySelector('button')!.click();
  await vi.waitFor(() => expect(palette()).not.toBeNull());
  await settle();
}

describe.each(MODES)('Command (%s)', (mode) => {
  it('open, with groups, icon, shortcut and a disabled result, passes axe', async () => {
    const el = await render(<Example />, mode);
    await open(el);
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe('Command behaviour', () => {
  it('opens on the search, a combobox over a listbox; the first result is highlighted', async () => {
    const el = await render(<Example />);
    await open(el);
    await vi.waitFor(() => expect(document.activeElement).toBe(input()));
    expect(input().getAttribute('role')).toBe('combobox');
    expect(document.getElementById(input().getAttribute('aria-controls')!)?.getAttribute('role')).toBe('listbox');
    expect(palette()!.getAttribute('role')).toBe('dialog');
    expect(active()?.textContent).toBe('Campanhas');
    expect(options()).toHaveLength(4);
  });

  it('filters by the search, ignoring accents and case, and by keywords; the empty group hides', async () => {
    const el = await render(<Example />);
    await open(el);
    await userEvent.type(input(), 'relatorio');
    expect(options().map((o) => o.textContent)).toEqual(['Relatórios']);
    const groups = [...palette()!.querySelectorAll<HTMLElement>('[role="group"]')];
    expect(getComputedStyle(groups[1]).display).toBe('none');
    await userEvent.clear(input());
    await userEvent.type(input(), 'ENVIO');
    expect(options().map((o) => o.textContent)).toEqual(['Novo disparoCtrl N']);
    await userEvent.clear(input());
    await userEvent.type(input(), 'xyz');
    expect(options()).toHaveLength(0);
    expect(palette()!.textContent).toContain('Nenhum resultado');
  });

  it('the arrows move the highlight (skipping the disabled result) and Enter runs it, closing and giving the focus back', async () => {
    const onSelect = vi.fn();
    const el = await render(<Example onSelect={onSelect} />);
    const trigger = el.querySelector('button')!;
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(palette()).not.toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(input()));
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(active()?.textContent).toContain('Novo disparo');
    await userEvent.keyboard('{ArrowDown}');
    expect(active()?.textContent).toBe('Campanhas');
    await userEvent.keyboard('{ArrowUp}');
    expect(active()?.textContent).toContain('Novo disparo');
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('disparo');
    await vi.waitFor(() => expect(palette()).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('search then Enter runs the first match', async () => {
    const onSelect = vi.fn();
    const el = await render(<Example onSelect={onSelect} />);
    await open(el);
    await userEvent.type(input(), 'camp{Enter}');
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('campanhas');
  });

  it('keeps the focus inside, locks the page scroll, and Escape closes giving the focus back (#10)', async () => {
    const el = await render(<Example />);
    const trigger = el.querySelector('button')!;
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(palette()).not.toBeNull());
    expect(scrollLocked()).toBe(true);
    await expectFocusTrapped(palette()!);
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(palette()).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('Ctrl K opens and closes it', async () => {
    await render(<Example />);
    await userEvent.keyboard('{Control>}k{/Control}');
    await vi.waitFor(() => expect(palette()).not.toBeNull());
    await userEvent.keyboard('{Control>}k{/Control}');
    await vi.waitFor(() => expect(palette()).toBeNull());
  });
});
