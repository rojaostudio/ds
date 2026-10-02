import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Button } from './button';
import { Dialog, DialogClose, type DialogSize } from './dialog';
import { Input } from './input';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';
import { expectFocusTrapped, scrollLocked } from './__tests__/overlay';

afterEach(cleanup);

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');

// The [RDS] maps dialog/title to text/heading, and Cancel is the neutral outline Button, whose label is
// text/heading too: flare-700 on the rojao light theme (2.9:1 on white). Kept out of the light matrix and pinned
// below until the Figma decides, as in alert-dialog.browser.test.tsx. The Input's label in the content is the same
// finding, pinned in input.browser.test.tsx.
const KNOWN_LIGHT = (mode: string) =>
  mode === 'light' ? ['.rds-dialog__title', '.rds-dialog .rds-button--neutral', '.rds-field__label'] : [];

function Example({ size, onConfirm = () => {}, showScrim }: { size?: DialogSize; onConfirm?: () => void; showScrim?: boolean }) {
  return (
    <Dialog
      trigger={<Button>Novo público</Button>}
      size={size}
      showScrim={showScrim}
      title="Novo público"
      description="Dê um nome e escolha a marca. Os contatos entram depois."
      confirmLabel="Criar público"
      onConfirm={onConfirm}
    >
      <Input label="Nome do público" />
    </Dialog>
  );
}

async function open(el: HTMLElement) {
  el.querySelector('button')!.click();
  await vi.waitFor(() => expect(dialog()).not.toBeNull());
  await settle();
  return dialog()!;
}

describe.each(MODES)('Dialog (%s)', (mode) => {
  it.each(['sm', 'default', 'lg'] as const)('open, size %s, passes axe', async (size) => {
    const el = await render(<Example size={size} />, mode);
    const d = await open(el);
    expect(d.classList).toContain(`rds-dialog--${size}`);
    expect(await axeViolations(document.body, KNOWN_LIGHT(mode))).toEqual([]);
  });
});

describe('Dialog behaviour', () => {
  it.fails('the title and Cancel on the rojao light theme pass axe (text/heading is flare-700)', async () => {
    const el = await render(<Example />, 'light');
    await open(el);
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it('the sizes are 400, 560 and 720 wide', async () => {
    await page.viewport(1280, 800);
    for (const [size, width] of [['sm', 400], ['default', 560], ['lg', 720]] as const) {
      const el = await render(<Example size={size} />);
      const d = await open(el);
      expect(Math.round(d.getBoundingClientRect().width)).toBe(width);
      cleanup();
    }
  });

  it('is a modal dialog named by its title and described by its description; the focus opens on the field', async () => {
    const el = await render(<Example />);
    const d = await open(el);
    expect(d.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(d.getAttribute('aria-labelledby')!)?.textContent).toBe('Novo público');
    expect(document.getElementById(d.getAttribute('aria-describedby')!)?.textContent).toContain('Dê um nome');
    await vi.waitFor(() => expect(document.activeElement?.tagName).toBe('INPUT'));
  });

  it('keeps the focus inside, locks the page scroll, and Escape closes giving the focus back to the trigger (#10)', async () => {
    const el = await render(<Example />);
    const trigger = el.querySelector('button')!;
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    expect(scrollLocked()).toBe(true);
    await expectFocusTrapped(dialog()!);
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(dialog()).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(scrollLocked()).toBe(false);
  });

  it('the ×, Cancel and a click on the veil close it', async () => {
    const el = await render(<Example />);
    const trigger = el.querySelector('button')!;
    for (const close of [
      () => dialog()!.querySelector<HTMLButtonElement>('[aria-label="Fechar"]')!.click(),
      () => [...dialog()!.querySelectorAll('button')].find((b) => b.textContent === 'Cancelar')!.click(),
      async () => {
        const scrim = document.querySelector<HTMLElement>('.rds-dialog__scrim')!;
        const r = scrim.getBoundingClientRect();
        await userEvent.click(scrim, { position: { x: r.width - 4, y: 4 } });
      },
    ]) {
      await open(el);
      await close();
      await vi.waitFor(() => expect(dialog()).toBeNull());
      await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    }
  });

  it('confirm calls onConfirm and keeps it open; DialogClose closes', async () => {
    const onConfirm = vi.fn();
    const el = await render(<Example onConfirm={onConfirm} />);
    const d = await open(el);
    [...d.querySelectorAll('button')].find((b) => b.textContent === 'Criar público')!.click();
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(dialog()).not.toBeNull();

    cleanup();
    await render(
      <Dialog defaultOpen title="Pronto" footer={<DialogClose asChild><Button>Fechar janela</Button></DialogClose>} />,
    );
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    [...dialog()!.querySelectorAll('button')].find((b) => b.textContent === 'Fechar janela')!.click();
    await vi.waitFor(() => expect(dialog()).toBeNull());
  });

  it('without showScrim the veil is clear but the page still is locked', async () => {
    const el = await render(<Example showScrim={false} />);
    await open(el);
    const scrim = document.querySelector<HTMLElement>('.rds-dialog__scrim')!;
    expect(getComputedStyle(scrim).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(scrollLocked()).toBe(true);
  });
});
