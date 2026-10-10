import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Button } from './button';
import { Dialog, DialogClose, type DialogSize } from './dialog';
import { Input } from './input';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';
import { drag, expectFocusTrapped, scrollLocked } from './__tests__/overlay';

afterEach(cleanup);

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');

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
  it.each(['sm', 'md', 'lg'] as const)('open, size %s, passes axe', async (size) => {
    const el = await render(<Example size={size} />, mode);
    const d = await open(el);
    expect(d.classList).toContain(`rds-dialog--${size}`);
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe('Dialog behaviour', () => {
  // The centred box: from 1024 up (the compact sheet is below).
  beforeEach(() => page.viewport(1280, 800));

  it('the title and Cancel on the rojao light theme pass axe', async () => {
    const el = await render(<Example />, 'light');
    await open(el);
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it('the sizes are 400, 560 and 720 wide', async () => {
    await page.viewport(1280, 800);
    for (const [size, width] of [['sm', 400], ['md', 560], ['lg', 720]] as const) {
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

describe('Dialog on a compact screen (the sheet, #45)', () => {
  beforeEach(() => page.viewport(390, 844));
  afterEach(() => page.viewport(1280, 800));

  const footerButtons = (d: HTMLElement) =>
    [...d.querySelectorAll<HTMLElement>('.rds-modal__footer button')].filter((b) => b.offsetParent !== null);

  it.each(MODES)('passes axe (%s)', async (mode) => {
    const el = await render(<Example />, mode);
    await open(el);
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it.each(['sm', 'md', 'lg'] as const)('size %s is stuck to the bottom, the screen wide, top corners only', async (size) => {
    const el = await render(<Example size={size} />);
    const d = await open(el);
    const r = d.getBoundingClientRect();
    expect(Math.round(r.bottom)).toBe(844);
    expect([Math.round(r.left), Math.round(r.width)]).toEqual([0, 390]);
    const style = getComputedStyle(d);
    expect(style.borderBottomLeftRadius).toBe('0px');
    expect(style.borderTopLeftRadius).not.toBe('0px');
    expect(d.querySelector<HTMLElement>('.rds-modal__handle-area')!.offsetParent).not.toBeNull();
  });

  it('stops at 560 and centres on a tablet', async () => {
    await page.viewport(768, 1024);
    const el = await render(<Example size="lg" />);
    const r = (await open(el)).getBoundingClientRect();
    expect(Math.round(r.width)).toBe(560);
    expect(Math.round(r.left)).toBe(104);
  });

  it('drops the default Cancel (out of Tab and of the tree); the action is full width and the × stays', async () => {
    const el = await render(<Example />);
    const d = await open(el);
    const cancel = [...d.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent === 'Cancelar')!;
    expect(getComputedStyle(cancel).display).toBe('none');
    expect(footerButtons(d).map((b) => b.textContent)).toEqual(['Criar público']);
    const footer = d.querySelector('.rds-modal__footer')!.getBoundingClientRect();
    expect(Math.round(footerButtons(d)[0].getBoundingClientRect().width)).toBe(Math.round(footer.width));
    expect(d.querySelector('[aria-label="Fechar"]')).not.toBeNull();
  });

  it('only the content scrolls, up to the window − 48 (Roger 10/10)', async () => {
    const el = await render(
      <Dialog trigger={<Button>Abrir</Button>} title="Longo" confirmLabel="Salvar">
        {Array.from({ length: 30 }, (_, i) => (
          <p key={i}>Linha {i + 1}</p>
        ))}
      </Dialog>,
    );
    const d = await open(el);
    expect(Math.round(d.getBoundingClientRect().height)).toBe(844 - 48);
    const body = d.querySelector<HTMLElement>('.rds-modal__body')!;
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    expect(getComputedStyle(body).overscrollBehaviorY).toBe('contain');
  });

  it('dragging the handle past 80 closes it and tells onOpenChange; a short drag does not', async () => {
    const onOpenChange = vi.fn();
    await render(<Dialog defaultOpen onOpenChange={onOpenChange} title="Arrastar" confirmLabel="Salvar" />);
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    await settle();
    drag(dialog()!.querySelector<HTMLElement>('.rds-modal__handle-area')!, 40);
    await settle();
    expect(dialog()).not.toBeNull();
    expect(dialog()!.style.transform).toBe('');
    drag(dialog()!.querySelector<HTMLElement>('.rds-modal__handle-area')!, 120);
    await vi.waitFor(() => expect(dialog()).toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('the veil, Escape and the × close it and give the focus back to the trigger', async () => {
    const el = await render(<Example />);
    const trigger = el.querySelector('button')!;
    for (const close of [
      () => dialog()!.querySelector<HTMLButtonElement>('[aria-label="Fechar"]')!.click(),
      () => userEvent.keyboard('{Escape}'),
      async () => {
        const scrim = document.querySelector<HTMLElement>('.rds-dialog__scrim')!;
        await userEvent.click(scrim, { position: { x: 195, y: 8 } });
      },
    ]) {
      await open(el);
      await close();
      await vi.waitFor(() => expect(dialog()).toBeNull());
      await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    }
  });

  it('a custom footer keeps every button, full width, the last (the main action) on top', async () => {
    await render(
      <Dialog
        defaultOpen
        title="Recortar"
        footer={
          <>
            <Button tone="neutral" variant="ghost">
              Cancelar
            </Button>
            <Button>Aplicar</Button>
          </>
        }
      />,
    );
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    await settle();
    const [a, b] = footerButtons(dialog()!);
    expect([a.textContent, b.textContent]).toEqual(['Cancelar', 'Aplicar']);
    expect(b.getBoundingClientRect().top).toBeLessThan(a.getBoundingClientRect().top);
    expect(Math.round(a.getBoundingClientRect().width)).toBe(Math.round(b.getBoundingClientRect().width));
  });

  it('the focus opens on the field, and the field is at least 16px (no zoom on iOS)', async () => {
    const el = await render(<Example />);
    await open(el);
    await vi.waitFor(() => expect(document.activeElement?.tagName).toBe('INPUT'));
    expect(parseFloat(getComputedStyle(document.activeElement!).fontSize)).toBeGreaterThanOrEqual(16);
  });

  it('rises above the on-screen keyboard', async () => {
    const viewport = window.visualViewport!;
    Object.defineProperty(viewport, 'height', { configurable: true, get: () => 500 });
    try {
      const el = await render(<Example />);
      const d = await open(el);
      await vi.waitFor(() => expect(document.activeElement?.tagName).toBe('INPUT'));
      viewport.dispatchEvent(new Event('resize'));
      await vi.waitFor(() => expect(Math.round(d.getBoundingClientRect().bottom)).toBe(500));
      expect(footerButtons(d)[0].getBoundingClientRect().bottom).toBeLessThanOrEqual(500);
    } finally {
      delete (viewport as unknown as Record<string, unknown>).height;
    }
  });
});

describe('Dialog footerStart (Figma 09/10)', () => {
  afterEach(() => page.viewport(1280, 800));

  function Total({ size }: { size?: DialogSize }) {
    return (
      <Dialog
        defaultOpen
        size={size}
        title="Cartão de visita"
        confirmLabel="Adicionar ao pedido"
        footerStart={<span>Total · R$ 180,00</span>}
      >
        <Input label="Quantidade" />
      </Dialog>
    );
  }

  it('md on a wide screen: the total at the start, on the buttons line, the buttons at the end', async () => {
    await page.viewport(1280, 800);
    await render(<Total />);
    await settle();
    const d = dialog()!;
    const start = d.querySelector<HTMLElement>('.rds-modal__footer-start')!.getBoundingClientRect();
    const confirm = [...d.querySelectorAll<HTMLElement>('.rds-modal__footer button')].at(-1)!.getBoundingClientRect();
    const footer = d.querySelector<HTMLElement>('.rds-modal__footer')!.getBoundingClientRect();
    expect(Math.round(start.left)).toBe(Math.round(footer.left));
    expect(Math.round(confirm.right)).toBe(Math.round(footer.right));
    expect(start.bottom).toBeGreaterThan(confirm.top);
    expect(start.right).toBeLessThanOrEqual(confirm.left);
  });

  it('on the compact sheet: the total above the full-width action', async () => {
    await page.viewport(390, 844);
    await render(<Total />);
    await settle();
    const d = dialog()!;
    const start = d.querySelector<HTMLElement>('.rds-modal__footer-start')!.getBoundingClientRect();
    const confirm = [...d.querySelectorAll<HTMLElement>('.rds-modal__footer button')]
      .filter((b) => b.offsetParent !== null)
      .at(-1)!
      .getBoundingClientRect();
    expect(start.bottom).toBeLessThanOrEqual(confirm.top);
    expect(Math.round(confirm.top - start.bottom)).toBe(16);
  });
});

describe('Dialog max height (Roger 09/10: 48 above, 48 below)', () => {
  afterEach(() => page.viewport(1280, 800));

  it('a long form stops at the window − 96; only the body scrolls, the footer stays in view', async () => {
    await page.viewport(1280, 800);
    await render(
      <Dialog defaultOpen title="Apostila sob medida" confirmLabel="Adicionar" footerStart={<span>Total · R$ 180,00</span>}>
        {Array.from({ length: 20 }, (_, i) => (
          <Input key={i} label={`Campo ${i + 1}`} />
        ))}
      </Dialog>,
    );
    await settle();
    const d = dialog()!;
    const box = d.getBoundingClientRect();
    expect(Math.round(box.height)).toBe(800 - 96);
    const body = d.querySelector<HTMLElement>('.rds-modal__body')!;
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    const footer = d.querySelector<HTMLElement>('.rds-modal__footer')!.getBoundingClientRect();
    expect(footer.bottom).toBeLessThanOrEqual(box.bottom);
  });

  it('on the compact sheet a long form with a total keeps the total and the action in view; only the body scrolls', async () => {
    await page.viewport(390, 844);
    await render(
      <Dialog defaultOpen title="Adesivo" confirmLabel="Adicionar" footerStart={<span>Total · R$ 180,00</span>}>
        {Array.from({ length: 20 }, (_, i) => (
          <Input key={i} label={`Campo ${i + 1}`} />
        ))}
      </Dialog>,
    );
    await settle();
    const d = dialog()!;
    const box = d.getBoundingClientRect();
    expect(Math.round(box.top)).toBe(48);
    const body = d.querySelector<HTMLElement>('.rds-modal__body')!;
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    const start = d.querySelector<HTMLElement>('.rds-modal__footer-start')!.getBoundingClientRect();
    const confirm = [...d.querySelectorAll<HTMLElement>('.rds-modal__footer button')]
      .filter((b) => b.offsetParent !== null)
      .at(-1)!
      .getBoundingClientRect();
    expect(start.top).toBeGreaterThanOrEqual(body.getBoundingClientRect().bottom);
    expect(confirm.bottom).toBeLessThanOrEqual(844);
    expect(start.bottom).toBeLessThanOrEqual(confirm.top);
  });
});
