import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { AlertDialog, type AlertDialogTone } from './alert-dialog';
import { Button } from './button';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

const dialog = () => document.querySelector<HTMLElement>('[role="alertdialog"]');

function Example({ tone = 'danger', onConfirm = () => {} }: { tone?: AlertDialogTone; onConfirm?: () => void }) {
  return (
    <AlertDialog
      trigger={<Button tone="danger">Excluir lista</Button>}
      tone={tone}
      title="Excluir a lista Clientes?"
      description="Os 1.240 contatos saem de todas as campanhas. Não dá para desfazer."
      confirmLabel="Excluir lista"
      onConfirm={onConfirm}
    />
  );
}

describe.each(MODES)('AlertDialog (%s)', (mode) => {
  it.each(['danger', 'action'] as const)('open, tone %s, passes axe', async (tone) => {
    const el = await render(<Example tone={tone} />, mode);
    el.querySelector('button')!.click();
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    await settle();
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe('AlertDialog behaviour', () => {
  it('the title and Cancel on the rojao light theme pass axe (text/heading is navy)', async () => {
    const el = await render(<Example />, 'light');
    el.querySelector('button')!.click();
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    await settle();
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it('is an alertdialog named by its title and described by its text; the focus opens on Cancel', async () => {
    const el = await render(<Example />);
    el.querySelector('button')!.click();
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    const d = dialog()!;
    expect(document.getElementById(d.getAttribute('aria-labelledby')!)?.textContent).toBe('Excluir a lista Clientes?');
    expect(document.getElementById(d.getAttribute('aria-describedby')!)?.textContent).toContain('Não dá para desfazer');
    await vi.waitFor(() => expect(document.activeElement?.textContent).toBe('Cancelar'));
  });

  it('keeps the focus inside (Tab cycles) and gives it back to the trigger on Cancel', async () => {
    const el = await render(<Example />);
    const trigger = el.querySelector('button')!;
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(document.activeElement?.textContent).toBe('Cancelar'));
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe('Excluir lista');
    expect(dialog()!.contains(document.activeElement)).toBe(true);
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe('Cancelar');
    await userEvent.tab({ shift: true });
    expect(dialog()!.contains(document.activeElement)).toBe(true);
    [...dialog()!.querySelectorAll('button')].find((b) => b.textContent === 'Cancelar')!.click();
    await vi.waitFor(() => expect(dialog()).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('confirm calls onConfirm, closes and gives the focus back', async () => {
    const onConfirm = vi.fn();
    const el = await render(<Example onConfirm={onConfirm} />);
    const trigger = el.querySelector('button')!;
    trigger.click();
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    const confirm = [...dialog()!.querySelectorAll('button')].find((b) => b.textContent === 'Excluir lista')!;
    confirm.click();
    expect(onConfirm).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(dialog()).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});

describe('AlertDialog on a compact screen (the sheet, #45)', () => {
  beforeEach(() => page.viewport(390, 844));
  afterEach(() => page.viewport(1280, 800));

  async function openIt() {
    const el = await render(<Example />);
    el.querySelector('button')!.click();
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    await settle();
    return dialog()!;
  }

  it.each(MODES)('passes axe (%s)', async (mode) => {
    const el = await render(<Example />, mode);
    el.querySelector('button')!.click();
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    await settle();
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it('is stuck to the bottom, the screen wide, no handle; both actions full width, the confirm on top', async () => {
    const d = await openIt();
    const r = d.getBoundingClientRect();
    expect([Math.round(r.bottom), Math.round(r.left), Math.round(r.width)]).toEqual([844, 0, 390]);
    expect(d.querySelector('.rds-modal__handle-area')).toBeNull();
    const [cancel, confirm] = [...d.querySelectorAll<HTMLElement>('.rds-alert-dialog__footer button')];
    expect([cancel.textContent, confirm.textContent]).toEqual(['Cancelar', 'Excluir lista']);
    expect(confirm.getBoundingClientRect().top).toBeLessThan(cancel.getBoundingClientRect().top);
    const footer = d.querySelector('.rds-alert-dialog__footer')!.getBoundingClientRect();
    expect(Math.round(cancel.getBoundingClientRect().width)).toBe(Math.round(footer.width));
    expect(Math.round(confirm.getBoundingClientRect().width)).toBe(Math.round(footer.width));
  });

  it('the focus opens on Cancel; neither the veil nor Escape closes it (the decision is required)', async () => {
    await openIt();
    await vi.waitFor(() => expect(document.activeElement?.textContent).toBe('Cancelar'));
    await userEvent.click(document.body, { position: { x: 195, y: 8 } });
    await settle();
    expect(dialog()).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    await settle();
    expect(dialog()).not.toBeNull();
  });
});

describe('AlertDialog on a wide screen', () => {
  beforeEach(() => page.viewport(1280, 800));

  it('is centred, 400 wide, the buttons in a row', async () => {
    const el = await render(<Example />);
    el.querySelector('button')!.click();
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    await settle();
    const r = dialog()!.getBoundingClientRect();
    expect(Math.round(r.width)).toBe(400);
    expect(Math.round(r.left)).toBe(440);
    const [cancel, confirm] = [...dialog()!.querySelectorAll<HTMLElement>('.rds-alert-dialog__footer button')];
    expect(Math.round(cancel.getBoundingClientRect().top)).toBe(Math.round(confirm.getBoundingClientRect().top));
  });

  it('stops at the window − 96 (48 above, 48 below); a long text scrolls, the buttons stay in view', async () => {
    await render(
      <AlertDialog
        defaultOpen
        title="Recusar o orçamento?"
        description={'O cliente recebe o aviso. '.repeat(120)}
        confirmLabel="Recusar"
        onConfirm={() => {}}
      />,
    );
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    await settle();
    const d = dialog()!;
    expect(Math.round(d.getBoundingClientRect().height)).toBe(800 - 96);
    const content = d.querySelector<HTMLElement>('.rds-alert-dialog__content')!;
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    const footer = d.querySelector<HTMLElement>('.rds-alert-dialog__footer')!.getBoundingClientRect();
    expect(footer.bottom).toBeLessThanOrEqual(d.getBoundingClientRect().bottom);
  });
});
