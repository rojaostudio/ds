import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { RowActions } from './row-actions';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

// No known violation left: the neutral outline and ghost Buttons pass since the Rojão heading went navy.
const KNOWN_LIGHT = (_mode: string): string[] => [];

const ITEMS = [
  { label: 'Editar', onClick: () => {} },
  { label: 'Duplicar', onClick: () => {} },
  { label: 'Excluir', tone: 'danger' as const, onClick: () => {} },
];

// The menu is portalled to the body, outside the test's <main>: the landmark rule (region) does not apply to a
// floating layer (as in dropdown-menu.browser.test.tsx).
const outsideRegion = (lines: string[]) => lines.filter((line) => !line.startsWith('region:'));

const more = (el: HTMLElement) => el.querySelector<HTMLElement>('[aria-label="Mais ações"]')!;

describe.each(MODES)('RowActions (%s)', (mode) => {
  it('a link, a button and the menu trigger pass axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8 }}>
        <RowActions primaryLabel="Ver pedido" primaryHref="#pedido" items={ITEMS} />
        <RowActions primaryLabel="Ver cliente" primaryOnClick={() => {}} />
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT(mode))).toEqual([]);
  });

  it('the open menu passes axe', async () => {
    const el = await render(<RowActions primaryLabel="Ver" primaryOnClick={() => {}} items={ITEMS} />, mode);
    await userEvent.click(more(el));
    await settle();
    expect(outsideRegion(await axeViolations(document.body, KNOWN_LIGHT(mode)))).toEqual([]);
  });
});

describe('RowActions behaviour', () => {
  it('the primary action is an outline neutral Button (a link with href); clicks never reach the row', async () => {
    const onRow = vi.fn();
    const onPrimary = vi.fn();
    const el = await render(
      <div onClick={onRow}>
        <RowActions primaryLabel="Ver" primaryOnClick={onPrimary} />
        <RowActions primaryLabel="Abrir" primaryHref="#x" />
      </div>,
    );
    const [button, link] = el.querySelectorAll<HTMLElement>('.rds-button');
    expect(button.className).toContain('rds-button--outline');
    expect(link.tagName).toBe('A');
    button.click();
    link.click();
    expect(onPrimary).toHaveBeenCalledOnce();
    expect(onRow).not.toHaveBeenCalled();
  });

  it('danger items go last, after a separator', async () => {
    const onDelete = vi.fn();
    const el = await render(
      <RowActions
        primaryLabel="Ver"
        items={[
          { label: 'Excluir', tone: 'danger', onClick: onDelete },
          { label: 'Editar', onClick: () => {} },
        ]}
      />,
    );
    await userEvent.click(more(el));
    await settle();
    const menu = document.querySelector('[role="menu"]')!;
    expect([...menu.querySelectorAll('[role="menuitem"]')].map((i) => i.textContent)).toEqual(['Editar', 'Excluir']);
    expect(menu.querySelector('[role="separator"]')).not.toBeNull();
    await userEvent.click(menu.querySelectorAll<HTMLElement>('[role="menuitem"]')[1]);
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
