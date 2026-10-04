import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, useState } from 'react';
import { page } from 'vitest/browser';
import { SavingBar, type SavingBarPlacement } from './saving-bar';
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

describe('Toaster position: bottom-center, above the bar at the foot', () => {
  afterEach(async () => {
    await page.viewport(1280, 800);
  });

  let showBar: (placement: SavingBarPlacement | null) => void = () => {};
  function Page({ initial }: { initial: SavingBarPlacement | null }) {
    const [bar, setBar] = useState(initial);
    showBar = setBar;
    return <Toaster>{bar && <SavingBar placement={bar} message="Pendente" onSave={() => {}} onDiscard={() => {}} />}</Toaster>;
  }

  /** The newest toast on screen, once its entry has settled. */
  async function shown() {
    act(() => {
      toast({ id: 'pos', title: 'Disparo agendado', duration: 60000 });
    });
    await vi.waitFor(() => expect(toasts()).toHaveLength(1));
    await settle();
    return toasts()[0].getBoundingClientRect();
  }

  it.each([1280, 390])('at %i: centred, 16 off the foot; on the phone the width minus 16 on each side', async (width) => {
    await page.viewport(width, 800);
    await render(<Page initial={null} />);
    const box = await shown();
    expect(box.left + box.width / 2).toBeCloseTo(width / 2, 0);
    expect(window.innerHeight - box.bottom).toBe(16);
    expect(box.width).toBe(width === 390 ? 390 - 32 : 460);
    expect(document.documentElement.style.getPropertyValue('--toast-offset-bottom')).toBe('');
  });

  it.each([
    [1280, 'docked', 68 + 16],
    [1280, 'floating', 64 + 24 + 16],
    [390, 'docked', 64 + 16],
    [390, 'floating', 64 + 16],
  ] as const)('at %i with the %s bar: the stack rises above it (%i), and goes back to 16 when the bar leaves', async (width, placement, offset) => {
    await page.viewport(width, 800);
    await render(<Page initial={placement} />);
    let box = await shown();
    expect(window.innerHeight - box.bottom).toBe(offset);
    expect(box.left + box.width / 2).toBeCloseTo(width / 2, 0);
    const bar = document.querySelector<HTMLElement>('.rds-savingbar')!;
    const footprint = bar.getBoundingClientRect().height + Number.parseFloat(getComputedStyle(bar).bottom);
    expect(offset).toBe(footprint + 16);
    await act(async () => showBar(null));
    box = toasts()[0].getBoundingClientRect();
    expect(window.innerHeight - box.bottom).toBe(16);
    await act(async () => showBar(placement));
    box = toasts()[0].getBoundingClientRect();
    expect(window.innerHeight - box.bottom).toBe(offset);
  });

  it('follows the breakpoint: floating at 1280 (64 + 24), docked below 1024 (64)', async () => {
    await page.viewport(1280, 800);
    await render(<Page initial="floating" />);
    expect(window.innerHeight - (await shown()).bottom).toBe(104);
    await page.viewport(390, 800);
    await vi.waitFor(() => expect(window.innerHeight - toasts()[0].getBoundingClientRect().bottom).toBe(80));
  });

  it('a toast with the bar on screen passes axe, light and dark', async () => {
    await page.viewport(1280, 800);
    for (const mode of MODES) {
      await render(<Page initial="docked" />, mode);
      const box = await shown();
      const bar = document.querySelector<HTMLElement>('.rds-savingbar')!;
      // The bar is in the page flow here (sticky); what matters is the room the stack keeps: its height plus 16.
      expect(window.innerHeight - box.bottom).toBe(bar.getBoundingClientRect().height + 16);
      expect(await axeViolations(document.body)).toEqual([]);
      act(() => toast.dismiss());
      cleanup();
    }
  });
});
