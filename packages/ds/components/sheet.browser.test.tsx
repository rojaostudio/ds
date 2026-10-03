import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Button } from './button';
import { Input } from './input';
import { Sheet, SheetClose, type SheetSide } from './sheet';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';
import { expectFocusTrapped, scrollLocked } from './__tests__/overlay';

afterEach(cleanup);

const sheet = () => document.querySelector<HTMLElement>('[role="dialog"]');


function Example({ side }: { side?: SheetSide }) {
  return (
    <Sheet
      trigger={<Button variant="outline">Filtros</Button>}
      side={side}
      title="Filtros"
      description="Mostre só os disparos que importam agora."
      confirmLabel="Aplicar filtros"
    >
      <Input label="Campanha" />
      <Input label="Canal" />
    </Sheet>
  );
}

async function open(el: HTMLElement) {
  el.querySelector('button')!.click();
  await vi.waitFor(() => expect(sheet()).not.toBeNull());
  await settle();
  return sheet()!;
}

describe.each(MODES)('Sheet (%s)', (mode) => {
  it.each(['right', 'left'] as const)('open, side %s, passes axe', async (side) => {
    const el = await render(<Example side={side} />, mode);
    await open(el);
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe('Sheet behaviour', () => {
  it('the title, Cancel and the label (→ text/heading) on the rojao light theme pass axe', async () => {
    const el = await render(<Example />, 'light');
    await open(el);
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it('is 400 wide, the screen tall, stuck to its side', async () => {
    await page.viewport(1280, 800);
    for (const side of ['right', 'left'] as const) {
      const el = await render(<Example side={side} />);
      const r = (await open(el)).getBoundingClientRect();
      expect(Math.round(r.width)).toBe(400);
      expect(Math.round(r.height)).toBe(window.innerHeight);
      if (side === 'right') expect(Math.round(r.right)).toBe(window.innerWidth);
      else expect(Math.round(r.left)).toBe(0);
      cleanup();
    }
  });

  it('is a modal dialog named by its title; the focus opens on the first field', async () => {
    const el = await render(<Example />);
    const s = await open(el);
    expect(s.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(s.getAttribute('aria-labelledby')!)?.textContent).toBe('Filtros');
    await vi.waitFor(() => expect(document.activeElement?.tagName).toBe('INPUT'));
  });

  it('keeps the focus inside, locks the page scroll, and Escape closes giving the focus back to the trigger (#10)', async () => {
    const el = await render(<Example />);
    const trigger = el.querySelector('button')!;
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(sheet()).not.toBeNull());
    expect(scrollLocked()).toBe(true);
    await expectFocusTrapped(sheet()!);
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(sheet()).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(scrollLocked()).toBe(false);
  });

  it('the × and SheetClose close it', async () => {
    const el = await render(<Example />);
    const s = await open(el);
    s.querySelector<HTMLButtonElement>('[aria-label="Fechar"]')!.click();
    await vi.waitFor(() => expect(sheet()).toBeNull());

    cleanup();
    await render(
      <Sheet
        defaultOpen
        title="Detalhes"
        footer={
          <SheetClose asChild>
            <Button>Pronto</Button>
          </SheetClose>
        }
      />,
    );
    await vi.waitFor(() => expect(sheet()).not.toBeNull());
    [...sheet()!.querySelectorAll('button')].find((b) => b.textContent === 'Pronto')!.click();
    await vi.waitFor(() => expect(sheet()).toBeNull());
  });
});
