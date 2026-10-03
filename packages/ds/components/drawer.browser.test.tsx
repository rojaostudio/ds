import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Button } from './button';
import { Drawer } from './drawer';
import { Input } from './input';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';
import { expectFocusTrapped, scrollLocked } from './__tests__/overlay';

afterEach(cleanup);

const drawer = () => document.querySelector<HTMLElement>('[role="dialog"]');

function Example() {
  return (
    <Drawer
      trigger={<Button variant="outline">Filtros</Button>}
      title="Filtros"
      description="Mostre só os disparos que importam agora."
      confirmLabel="Aplicar filtros"
    >
      <Input label="Campanha" />
    </Drawer>
  );
}

async function open(el: HTMLElement) {
  el.querySelector('button')!.click();
  await vi.waitFor(() => expect(drawer()).not.toBeNull());
  await settle();
  return drawer()!;
}

/** A pointer drag on the handle, `dy` px down. */
function drag(area: HTMLElement, dy: number) {
  const r = area.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const at = (type: string, clientY: number) =>
    area.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY, pointerId: 1 }));
  at('pointerdown', y);
  at('pointermove', y + dy);
  at('pointerup', y + dy);
}

describe.each(MODES)('Drawer (%s)', (mode) => {
  it('open passes axe', async () => {
    const el = await render(<Example />, mode);
    await open(el);
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe('Drawer behaviour', () => {
  it('the title, Cancel and the label on the rojao light theme pass axe', async () => {
    const el = await render(<Example />, 'light');
    await open(el);
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it('comes up from the bottom with the handle and no ×; the footer is stacked, the main action first', async () => {
    await page.viewport(390, 844);
    const el = await render(<Example />);
    const d = await open(el);
    expect(Math.round(d.getBoundingClientRect().bottom)).toBe(window.innerHeight);
    expect(d.querySelector('.rds-drawer__handle')).not.toBeNull();
    expect(d.querySelector('[aria-label="Fechar"]')).toBeNull();
    const buttons = [...d.querySelectorAll('.rds-modal__footer button')].map((b) => b.textContent);
    expect(buttons).toEqual(['Aplicar filtros', 'Cancelar']);
  });

  it('is a modal dialog named by its title; the focus opens on the field', async () => {
    const el = await render(<Example />);
    const d = await open(el);
    expect(d.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(d.getAttribute('aria-labelledby')!)?.textContent).toBe('Filtros');
    await vi.waitFor(() => expect(document.activeElement?.tagName).toBe('INPUT'));
  });

  it('keeps the focus inside, locks the page scroll, and Escape closes giving the focus back to the trigger (#10)', async () => {
    const el = await render(<Example />);
    const trigger = el.querySelector('button')!;
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(drawer()).not.toBeNull());
    expect(scrollLocked()).toBe(true);
    await expectFocusTrapped(drawer()!);
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(drawer()).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(scrollLocked()).toBe(false);
  });

  it('Cancel closes it; dragging the handle down past 80px closes it, a short drag does not', async () => {
    const el = await render(<Example />);
    const trigger = el.querySelector('button')!;
    let d = await open(el);
    [...d.querySelectorAll('button')].find((b) => b.textContent === 'Cancelar')!.click();
    await vi.waitFor(() => expect(drawer()).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));

    d = await open(el);
    drag(d.querySelector<HTMLElement>('.rds-drawer__handle-area')!, 40);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(drawer()).not.toBeNull();
    drag(d.querySelector<HTMLElement>('.rds-drawer__handle-area')!, 120);
    await vi.waitFor(() => expect(drawer()).toBeNull());
  });
});
