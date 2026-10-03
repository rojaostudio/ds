import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { emitRdsCss, generateRdsTheme, type BrandDef } from '@rojaostudio/ds-core/generate';
import { Drawer } from './drawer';
import { SavingBar, type SavingBarStatus } from './saving-bar';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

let brandStyle: HTMLStyleElement | null = null;
afterEach(() => {
  cleanup();
  brandStyle?.remove();
  brandStyle = null;
});

const STATUSES: SavingBarStatus[] = ['unsaved', 'saving', 'error'];

describe.each(MODES)('SavingBar (%s)', (mode) => {
  it('every status passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8 }}>
        {STATUSES.map((status) => (
          <SavingBar key={status} status={status} aria-label={`Salvar (${status})`} onSave={() => {}} onDiscard={() => {}} />
        ))}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('SavingBar behaviour', () => {
  it('unsaved: message, Descartar and Salvar', async () => {
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    const el = await render(<SavingBar onSave={onSave} onDiscard={onDiscard} />);
    expect(el.querySelector('[role="status"]')!.textContent).toBe('Alterações não salvas');
    const [discard, save] = el.querySelectorAll('button');
    expect([discard.textContent, save.textContent]).toEqual(['Descartar', 'Salvar']);
    discard.click();
    save.click();
    expect(onDiscard).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('without onDiscard there is no Descartar (showDiscard off)', async () => {
    const el = await render(<SavingBar onSave={() => {}} />);
    expect([...el.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Salvar']);
  });

  it('saving: says Salvando… and the buttons stay focusable but ignore clicks', async () => {
    const onSave = vi.fn();
    const el = await render(<SavingBar status="saving" onSave={onSave} onDiscard={() => {}} />);
    expect(el.querySelector('[role="status"]')!.textContent).toBe('Salvando…');
    for (const b of el.querySelectorAll('button')) expect(b.getAttribute('aria-disabled')).toBe('true');
    const save = [...el.querySelectorAll('button')].at(-1)!;
    save.focus();
    expect(document.activeElement).toBe(save);
    save.click();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('error: the error text and Tentar de novo', async () => {
    const onSave = vi.fn();
    const el = await render(<SavingBar status="error" onSave={onSave} />);
    expect(el.querySelector('[role="status"]')!.textContent).toBe('Não salvou. Tente de novo.');
    const retry = el.querySelector('button')!;
    expect(retry.textContent).toBe('Tentar de novo');
    retry.click();
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('at 390 (compact): the message on top, at most 2 lines, no word broken; Descartar and Salvar share the width', async () => {
    await page.viewport(390, 800);
    const message = 'Você alterou o preço, o estoque e a descrição de três produtos e ainda não salvou nenhuma dessas alterações';
    const el = await render(
      <div style={{ width: 390 }}>
        <SavingBar message={message} onSave={() => {}} onDiscard={() => {}} />
      </div>,
    );
    const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
    const row = bar.querySelector<HTMLElement>('.rds-savingbar__row')!;
    expect(getComputedStyle(row).flexDirection).toBe('column');
    const text = bar.querySelector<HTMLElement>('.rds-savingbar__text')!;
    const style = getComputedStyle(text);
    expect(style.webkitLineClamp).toBe('2');
    expect(text.getBoundingClientRect().height).toBeLessThanOrEqual(2 * parseFloat(style.lineHeight) + 0.5);
    expect(['normal', 'keep-all']).toContain(style.wordBreak);
    expect(style.overflowWrap).toBe('normal');
    const [discard, save] = [...bar.querySelectorAll<HTMLElement>('button')];
    const a = discard.getBoundingClientRect();
    const b = save.getBoundingClientRect();
    expect(a.top).toBeGreaterThan(text.getBoundingClientRect().bottom);
    expect(a.top).toBe(b.top);
    expect(Math.abs(a.width - b.width)).toBeLessThan(1);
    // Each label on one line: a button keeps its 44.
    for (const r of [a, b]) expect(r.height).toBe(44);
    expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
  });

  it('from 1024 (expanded): one row, the message grows (at least 160) beside the actions', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <div style={{ width: 1100 }}>
        <SavingBar onSave={() => {}} onDiscard={() => {}} />
      </div>,
    );
    const row = el.querySelector<HTMLElement>('.rds-savingbar__row')!;
    expect(getComputedStyle(row).flexDirection).toBe('row');
    const msg = el.querySelector<HTMLElement>('.rds-savingbar__message')!;
    expect(getComputedStyle(msg).minWidth).toBe('160px');
    expect(getComputedStyle(msg).flexBasis).toBe('160px');
    const actions = el.querySelector<HTMLElement>('.rds-savingbar__actions')!.getBoundingClientRect();
    expect(actions.top).toBeLessThan(msg.getBoundingClientRect().bottom);
  });

  it('compact passes axe in both modes', async () => {
    await page.viewport(390, 800);
    for (const mode of MODES) {
      const el = await render(
        <div style={{ width: 390 }}>
          <SavingBar status="error" onSave={() => {}} onDiscard={() => {}} />
        </div>,
        mode,
      );
      expect(await axeViolations(el)).toEqual([]);
      cleanup();
    }
  });
});

/** A colour as getComputedStyle gives it (rgb/rgba), from a 6- or 8-digit hex. */
function rgb(hex: string) {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  if (n.length === 8) return `rgba(${r}, ${g}, ${b}, ${Number((parseInt(n.slice(6, 8), 16) / 255).toFixed(3))})`;
  return `rgb(${r}, ${g}, ${b})`;
}

/** The plate's page colour as the shipped theme draws it, read off a bare .ds-plate. */
function plateColour() {
  const probe = document.createElement('div');
  probe.className = 'ds-plate';
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).getPropertyValue('--surface-page').trim();
  probe.remove();
  return value;
}

describe('SavingBar on the plate', () => {
  it('is the brand plate (.ds-plate): the same colours over a light and a dark page, and passes axe', async () => {
    const seen: string[] = [];
    for (const mode of MODES) {
      const el = await render(<SavingBar onSave={() => {}} onDiscard={() => {}} />, mode);
      const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
      expect(bar.classList.contains('ds-plate')).toBe(true);
      const style = getComputedStyle(bar);
      expect(style.backgroundColor).toBe(rgb(plateColour()));
      seen.push(`${style.backgroundColor} ${style.color}`);
      expect(await axeViolations(el)).toEqual([]);
      cleanup();
    }
    expect(seen[0]).toBe(seen[1]);
  });

  it('Salvar is tone action fill and Descartar tone neutral ghost (no inverse)', async () => {
    const el = await render(<SavingBar onSave={() => {}} onDiscard={() => {}} />);
    const [discard, save] = [...el.querySelectorAll<HTMLElement>('button')];
    expect(el.querySelector('[class*="inverse"]')).toBeNull();
    // Inside the plate the action fill is colors/secondary/default with its ink, read on the bar.
    const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
    const role = (name: string) => getComputedStyle(bar).getPropertyValue(name).trim();
    expect(getComputedStyle(save).backgroundColor).toBe(rgb(role('--colors-secondary-default')));
    expect(getComputedStyle(save).color).toBe(rgb(role('--text-on-secondary')));
    expect(getComputedStyle(discard).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(discard).color).toBe(rgb(role('--text-heading')));
  });

  it('a light brand (cyan #00aeef from generateRdsTheme): the plate repaints and the buttons keep their contrast, light and dark', async () => {
    const theme = generateRdsTheme({ name: 'ciano', brand: { primary: '#00aeef' }, fonts: { body: 'inter' } } as BrandDef);
    brandStyle = document.createElement('style');
    brandStyle.textContent = emitRdsCss(theme);
    document.head.appendChild(brandStyle);
    for (const mode of MODES) {
      for (const width of [1280, 390]) {
        await page.viewport(width, 800);
        const el = await render(
          <div style={{ display: 'grid', gap: 8 }}>
            {STATUSES.map((status) => (
              <SavingBar
                key={status}
                status={status}
                aria-label={`Salvar (${status})`}
                onSave={() => {}}
                onDiscard={() => {}}
                onDetails={() => {}}
              />
            ))}
          </div>,
          mode,
        );
        const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
        expect(getComputedStyle(bar).backgroundColor).toBe(rgb(theme.brand['--surface-page']));
        expect(await axeViolations(el)).toEqual([]);
        cleanup();
      }
    }
  });
});

const CHECKLIST = 'Falta preço e prazo · 1 aviso';

/** A screen with the bar and the Drawer of what is missing, wired as the docs say. */
function WithDetails() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SavingBar
        message={CHECKLIST}
        onSave={() => {}}
        onDiscard={() => {}}
        onDetails={() => setOpen(true)}
        detailsExpanded={open}
        detailsControls="o-que-falta"
      />
      <Drawer open={open} onOpenChange={setOpen} title="O que falta" confirmLabel="Entendi">
        <ul id="o-que-falta">
          <li>Preço</li>
          <li>Prazo</li>
        </ul>
      </Drawer>
    </>
  );
}

describe('SavingBar details (showDetails)', () => {
  it('at 390 (compact) the message is a button: its name has the visible text and Ver o que falta; it opens the Drawer and the focus comes back on close', async () => {
    await page.viewport(390, 800);
    const el = await render(<WithDetails />);
    const status = el.querySelector<HTMLElement>('[role="status"]')!;
    const button = status.querySelector<HTMLButtonElement>('button.rds-savingbar__details')!;
    expect(button.type).toBe('button');
    expect(getComputedStyle(button).display).toBe('flex');
    // The text rendering is hidden: one message only, said once by the status.
    expect(getComputedStyle(status.querySelector<HTMLElement>(':scope > .rds-savingbar__text')!).display).toBe('none');
    const visible = button.querySelector<HTMLElement>('.rds-savingbar__text')!.textContent!;
    expect(visible).toBe(CHECKLIST);
    const name = button.textContent!;
    expect(name.startsWith(visible)).toBe(true);
    expect(name).toContain('Ver o que falta');
    expect(button.querySelector('svg')!.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe('o-que-falta');
    // The touch area is 44 tall; the drawing is not.
    expect(parseFloat(getComputedStyle(button, '::after').height)).toBeGreaterThanOrEqual(44);
    expect(button.getBoundingClientRect().height).toBeLessThan(44);
    expect(await axeViolations(el)).toEqual([]);

    await userEvent.click(button);
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    await settle();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('o-que-falta')).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    expect(button.getAttribute('aria-expanded')).toBe('false');
    await vi.waitFor(() => expect(document.activeElement).toBe(button));
  });

  it('focus-visible draws the savingbar ring; hover underlines', async () => {
    await page.viewport(390, 800);
    const el = await render(<SavingBar onSave={() => {}} onDetails={() => {}} />);
    const button = el.querySelector<HTMLElement>('.rds-savingbar__details')!;
    await userEvent.hover(button);
    expect(getComputedStyle(button.querySelector('.rds-savingbar__text')!).textDecorationLine).toBe('underline');
    await userEvent.tab();
    expect(document.activeElement).toBe(button);
    const style = getComputedStyle(button);
    const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
    expect(style.outlineStyle).toBe('solid');
    expect(style.outlineWidth).toBe('2px');
    expect(style.outlineColor).toBe(rgb(getComputedStyle(bar).getPropertyValue('--focus-ring').trim()));
    expect(style.borderRadius).toBe('12px');
  });

  it('at 1280 (expanded) the message stays text: no button shown', async () => {
    await page.viewport(1280, 800);
    const el = await render(<WithDetails />);
    const status = el.querySelector<HTMLElement>('[role="status"]')!;
    expect(getComputedStyle(status.querySelector('.rds-savingbar__details')!).display).toBe('none');
    const text = status.querySelector<HTMLElement>(':scope > .rds-savingbar__text')!;
    expect(getComputedStyle(text).display).not.toBe('none');
    expect(text.textContent).toBe(CHECKLIST);
    const shown = [...el.querySelectorAll('button')].filter((b) => b.getClientRects().length > 0);
    expect(shown.map((b) => b.textContent)).toEqual(['Descartar', 'Salvar']);
  });

  it('only in unsaved: saving and error keep the plain message', async () => {
    await page.viewport(390, 800);
    for (const status of ['saving', 'error'] as const) {
      const el = await render(<SavingBar status={status} onSave={() => {}} onDetails={() => {}} />);
      expect(el.querySelector('.rds-savingbar__details')).toBeNull();
      cleanup();
    }
  });
});
