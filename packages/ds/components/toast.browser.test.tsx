import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { Toaster, ToastView, toast, useToast, type ToastTone, type ToastVariant } from './toast';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(() => {
  act(() => toast.dismiss());
  cleanup();
});

const TONES: ToastTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];
const VARIANTS: ToastVariant[] = ['outline', 'soft', 'fill'];
const toasts = () => document.querySelectorAll<HTMLElement>('.rds-toast[data-state="open"]');

// On outline, the [RDS] maps toast/title to text/heading, and the action is the neutral ghost Button, whose label
// is text/heading too: flare-700 on the rojao light theme (2.9:1 on white). Kept out of the light matrix and pinned
// below until the Figma decides, as in button.browser.test.tsx.
const KNOWN_LIGHT_OUTLINE = (mode: string) =>
  mode === 'light' ? ['[class*="-outline"] .rds-toast__title', '[class*="-outline"] .rds-toast__action'] : [];

describe.each(MODES)('Toast (%s)', (mode) => {
  it('every tone × variant, with description, action and close, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8 }}>
        {TONES.flatMap((tone) =>
          VARIANTS.map((variant) => (
            <ToastView
              key={`${tone}-${variant}`}
              tone={tone}
              variant={variant}
              title="Disparo agendado"
              description="Terça, 10h, para 12,4 mil pessoas."
              action={{ label: 'Desfazer', onClick: () => {} }}
            />
          )),
        )}
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT_OUTLINE(mode))).toEqual([]);
  });

  it('a live toast passes axe', async () => {
    await render(<Toaster />, mode);
    act(() => {
      toast({ title: 'Disparo agendado', description: 'Terça, 10h.', tone: 'success', variant: 'fill', action: { label: 'Desfazer', onClick: () => {} } });
    });
    await vi.waitFor(() => expect(toasts()).toHaveLength(1));
    await settle();
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe('Toast behaviour', () => {
  it.fails('the outline title and action on the rojao light theme pass axe (text/heading is flare-700)', async () => {
    const el = await render(<ToastView title="Disparo agendado" action={{ label: 'Desfazer', onClick: () => {} }} />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('is announced in a live region: polite for most tones, assertive for danger', async () => {
    await render(<Toaster />);
    act(() => {
      toast({ title: 'Lista salva', tone: 'success' });
    });
    await vi.waitFor(() => {
      const region = [...document.querySelectorAll('[role="status"][aria-live]')].find((r) => r.textContent?.includes('Lista salva'));
      expect(region?.getAttribute('aria-live')).toBe('polite');
    });
    act(() => {
      toast({ title: 'Não foi possível enviar', tone: 'danger' });
    });
    await vi.waitFor(() => {
      const region = [...document.querySelectorAll('[role="status"][aria-live]')].find((r) =>
        r.textContent?.includes('Não foi possível enviar'),
      );
      expect(region?.getAttribute('aria-live')).toBe('assertive');
    });
  });

  it('the × closes it; toast.dismiss closes them all; at most three on screen', async () => {
    await render(<Toaster />);
    act(() => {
      for (const n of [1, 2, 3, 4]) toast({ title: `Aviso ${n}`, duration: 60000 });
    });
    await vi.waitFor(() => expect(toasts()).toHaveLength(3));
    expect([...toasts()].map((t) => t.querySelector('.rds-toast__title')?.textContent)).toEqual(['Aviso 2', 'Aviso 3', 'Aviso 4']);
    toasts()[0].querySelector<HTMLButtonElement>('[aria-label="Fechar"]')!.click();
    await vi.waitFor(() => expect(toasts()).toHaveLength(2));
    act(() => toast.dismiss());
    await vi.waitFor(() => expect(toasts()).toHaveLength(0));
  });

  it('the action runs and closes the toast; the same id replaces instead of stacking', async () => {
    const onClick = vi.fn();
    function Trigger() {
      const show = useToast();
      return (
        <button type="button" onClick={() => show({ id: 'save', title: 'Salvo', action: { label: 'Desfazer', onClick } })}>
          Salvar
        </button>
      );
    }
    const el = await render(
      <Toaster>
        <Trigger />
      </Toaster>,
    );
    const save = el.querySelector('button')!;
    save.click();
    save.click();
    await vi.waitFor(() => expect(toasts()).toHaveLength(1));
    toasts()[0].querySelector<HTMLButtonElement>('.rds-toast__action')!.click();
    expect(onClick).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(toasts()).toHaveLength(0));
  });
});
