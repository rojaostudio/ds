import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
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

  it('keeps the focus inside (Tab cycles) and gives it back to the trigger on Escape', async () => {
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
    await userEvent.keyboard('{Escape}');
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
