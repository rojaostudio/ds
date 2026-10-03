import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { Toaster, ToastView, toast, toastDuration, useToast, type ToastTone, type ToastVariant } from './toast';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(() => {
  act(() => toast.dismiss());
  cleanup();
});

const TONES: ToastTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];
const VARIANTS: ToastVariant[] = ['outline', 'soft', 'fill'];
const toasts = () => document.querySelectorAll<HTMLElement>('.rds-toast[data-state="open"]');

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
    expect(await axeViolations(el)).toEqual([]);
  });

  // text/on/info is black on blue/500 in the Figma (it was white, 3.12:1).
  it('info fill passes axe', async () => {
    const el = await render(<ToastView tone="info" variant="fill" title="Disparo agendado" />, mode);
    expect(await axeViolations(el)).toEqual([]);
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
  it('the outline title and action (→ text/heading) on the rojao light theme pass axe', async () => {
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

describe('Toast timing (WCAG 2.2.1)', () => {
  it('5 s by default; with an action, until closed; a duration given wins', () => {
    expect(toastDuration(undefined, false)).toBe(5000);
    expect(toastDuration(undefined, true)).toBe(Infinity);
    expect(toastDuration(8000, true)).toBe(8000);
    expect(toastDuration(2000, false)).toBe(2000);
  });

  it('a toast with an action starts no close timer; one without starts 5 s', async () => {
    await render(<Toaster />);
    const spy = vi.spyOn(window, 'setTimeout');
    try {
      act(() => {
        toast({ title: 'Arquivado', action: { label: 'Desfazer', onClick: () => {} } });
      });
      await vi.waitFor(() => expect(toasts()).toHaveLength(1));
      await settle();
      const delays = () => spy.mock.calls.map(([, ms]) => ms);
      expect(delays()).not.toContain(5000);
      expect(delays()).not.toContain(6000);
      expect(delays()).not.toContain(Infinity);

      act(() => {
        toast({ title: 'Salvo' });
      });
      await vi.waitFor(() => expect(toasts()).toHaveLength(2));
      await vi.waitFor(() => expect(delays()).toContain(5000));
    } finally {
      spy.mockRestore();
    }
  });

  it('closeLabel names the × (and its Tooltip) on every toast', async () => {
    await render(<Toaster closeLabel="Dispensar" />);
    act(() => {
      toast({ title: 'Salvo', duration: 60000 });
    });
    await vi.waitFor(() => expect(toasts()).toHaveLength(1));
    const close = toasts()[0].querySelector<HTMLButtonElement>('.rds-toast__close')!;
    expect(close.getAttribute('aria-label')).toBe('Dispensar');
    expect(toasts()[0].querySelector('[aria-label="Fechar"]')).toBeNull();
  });
});
