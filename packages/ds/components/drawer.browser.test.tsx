import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Button } from './button';
import { Drawer } from './drawer';
import { Input } from './input';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';
import { drag, expectFocusTrapped, scrollLocked } from './__tests__/overlay';

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
    expect(d.querySelector('.rds-modal__handle')).not.toBeNull();
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
    drag(d.querySelector<HTMLElement>('.rds-modal__handle-area')!, 40);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(drawer()).not.toBeNull();
    drag(d.querySelector<HTMLElement>('.rds-modal__handle-area')!, 120);
    await vi.waitFor(() => expect(drawer()).toBeNull());
  });

  it('long content: the panel stops at 85% of the screen and only the content scrolls; title and footer stay put', async () => {
    await page.viewport(390, 844);
    const el = await render(
      <Drawer trigger={<Button variant="outline">O que falta</Button>} title="O que falta" confirmLabel="Entendi">
        <ul>
          {Array.from({ length: 60 }, (_, i) => (
            <li key={i}>Item {i + 1} da lista do que falta</li>
          ))}
        </ul>
      </Drawer>,
    );
    const d = await open(el);
    const box = d.getBoundingClientRect();
    expect(box.height).toBeLessThanOrEqual(844 * 0.85 + 0.5);
    expect(Math.round(box.bottom)).toBe(844);
    const body = d.querySelector<HTMLElement>('.rds-modal__body')!;
    expect(getComputedStyle(body).overflowY).toBe('auto');
    expect(getComputedStyle(body).overscrollBehaviorY).toBe('contain');
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    const header = d.querySelector<HTMLElement>('.rds-modal__header')!;
    const footer = d.querySelector<HTMLElement>('.rds-modal__footer')!;
    const before = [header.getBoundingClientRect().top, footer.getBoundingClientRect().top];
    body.scrollTop = body.scrollHeight;
    expect(body.scrollTop).toBeGreaterThan(0);
    expect([header.getBoundingClientRect().top, footer.getBoundingClientRect().top]).toEqual(before);
    expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(box.bottom);
    expect(d.scrollHeight).toBeLessThanOrEqual(d.clientHeight);
  });
});
