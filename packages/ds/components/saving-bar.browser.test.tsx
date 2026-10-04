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

  it('saving: says Salvando…; Salvar is in loading (savingLabel, aria-busy) and Descartar disabled; both ignore clicks', async () => {
    await page.viewport(1280, 800);
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    const el = await render(<SavingBar status="saving" onSave={onSave} onDiscard={onDiscard} />);
    expect(el.querySelector('[role="status"]')!.textContent).toBe('Salvando…');
    const [discard, save] = [...el.querySelectorAll('button')];
    expect(discard.getAttribute('aria-disabled')).toBe('true');
    expect(save.getAttribute('aria-busy')).toBe('true');
    expect(save.textContent).toBe('Salvando…');
    expect(save.querySelector('.rds-button__loader')).not.toBeNull();
    save.focus();
    expect(document.activeElement).toBe(save);
    save.click();
    discard.click();
    expect(onSave).not.toHaveBeenCalled();
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it('saving: savingLabel renames Salvar in loading', async () => {
    const el = await render(<SavingBar status="saving" savingLabel="Gravando…" onSave={() => {}} />);
    expect(el.querySelector('button')!.textContent).toBe('Gravando…');
  });

  it('saving has one indicator only: the loader of Salvar, none in the message (expanded and compact)', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(<SavingBar status="saving" onSave={() => {}} onDiscard={() => {}} />);
      const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
      expect(bar.querySelector('.rds-savingbar__message svg')).toBeNull();
      const shown = [...bar.querySelectorAll<SVGElement>('svg')].filter((x) => x.getClientRects().length > 0);
      expect(shown).toHaveLength(1);
      expect(shown[0].closest('.rds-button__loader')).not.toBeNull();
      expect(bar.querySelectorAll('[role="progressbar"], .rds-spinner')).toHaveLength(0);
      cleanup();
    }
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

  it('at 390 (compact): one row, 64 tall, the message on the left and only Salvar on the right; no Descartar', async () => {
    await page.viewport(390, 800);
    const el = await render(
      <div style={{ width: 390 }}>
        <SavingBar onSave={() => {}} onDiscard={() => {}} />
      </div>,
    );
    const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
    const row = bar.querySelector<HTMLElement>('.rds-savingbar__row')!;
    expect(getComputedStyle(row).flexDirection).toBe('row');
    expect(bar.getBoundingClientRect().height).toBe(64);
    expect(getComputedStyle(bar).paddingTop).toBe('10px');
    // env(safe-area-inset-bottom) is 0 here: 10 + 0.
    expect(getComputedStyle(bar).paddingBottom).toBe('10px');
    const discard = bar.querySelector<HTMLElement>('.rds-savingbar__discard')!;
    expect(getComputedStyle(discard).display).toBe('none');
    const shown = [...bar.querySelectorAll<HTMLElement>('button')].filter((b) => b.getClientRects().length > 0);
    expect(shown.map((b) => b.textContent)).toEqual(['Salvar']);
    const msg = bar.querySelector<HTMLElement>('.rds-savingbar__message')!.getBoundingClientRect();
    const save = shown[0].getBoundingClientRect();
    expect(save.height).toBe(44);
    // One line: the message beside Salvar, on its left, centred with it.
    expect(msg.right).toBeLessThanOrEqual(save.left);
    expect(Math.abs(msg.top + msg.height / 2 - (save.top + save.height / 2))).toBeLessThanOrEqual(1);
    expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
  });

  it('at 390 (compact): a long message grows (flex 1) and clamps at 2 lines, no word broken', async () => {
    await page.viewport(390, 800);
    const message = 'Você alterou o preço, o estoque e a descrição de três produtos e ainda não salvou nenhuma dessas alterações';
    const el = await render(
      <div style={{ width: 390 }}>
        <SavingBar message={message} onSave={() => {}} onDiscard={() => {}} />
      </div>,
    );
    const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
    expect(getComputedStyle(bar.querySelector('.rds-savingbar__message')!).flexGrow).toBe('1');
    const text = bar.querySelector<HTMLElement>('.rds-savingbar__text')!;
    const style = getComputedStyle(text);
    expect(style.webkitLineClamp).toBe('2');
    expect(text.getBoundingClientRect().height).toBeLessThanOrEqual(2 * parseFloat(style.lineHeight) + 0.5);
    expect(['normal', 'keep-all']).toContain(style.wordBreak);
    expect(style.overflowWrap).toBe('normal');
    const save = [...bar.querySelectorAll<HTMLElement>('button')].find((b) => b.getClientRects().length > 0)!;
    expect(save.getBoundingClientRect().height).toBe(44);
    expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(save.getBoundingClientRect().left);
    expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
  });

  it('at 390 (compact) with onDetails: the details button on the left, Salvar on the right, one row of 64', async () => {
    await page.viewport(390, 800);
    const el = await render(
      <div style={{ width: 390 }}>
        <SavingBar message="Falta o preço" onSave={() => {}} onDiscard={() => {}} onDetails={() => {}} />
      </div>,
    );
    const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
    const shown = [...bar.querySelectorAll<HTMLElement>('button')].filter((b) => b.getClientRects().length > 0);
    expect(shown.map((b) => (b.classList.contains('rds-savingbar__details') ? 'details' : b.textContent))).toEqual(['details', 'Salvar']);
    const [details, save] = shown.map((b) => b.getBoundingClientRect());
    expect(details.right).toBeLessThanOrEqual(save.left);
    expect(bar.getBoundingClientRect().height).toBe(64);
  });

  it('at 1280 (expanded) unchanged: 12 24 padding (68 tall), the message, Descartar and Salvar in one row', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <div style={{ width: 1100 }}>
        <SavingBar onSave={() => {}} onDiscard={() => {}} />
      </div>,
    );
    const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
    expect(getComputedStyle(bar).padding).toBe('12px 24px');
    expect(bar.getBoundingClientRect().height).toBe(68);
    const shown = [...bar.querySelectorAll<HTMLElement>('button')].filter((b) => b.getClientRects().length > 0);
    expect(shown.map((b) => b.textContent)).toEqual(['Descartar', 'Salvar']);
    const [a, b] = shown.map((x) => x.getBoundingClientRect());
    expect(a.top).toBe(b.top);
    expect(a.right).toBeLessThanOrEqual(b.left);
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

/** A theme role as the shipped theme resolves it on the root, in the current mode. */
function role(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Mixes two rgb() colours as color-mix(in srgb, a p%, b) does, with no alpha. */
function mix(a: string, p: number, b: string) {
  const [x, y] = [channels(a), channels(b)];
  return x.slice(0, 3).map((v, i) => v * p + y[i] * (1 - p));
}

/** r, g, b (0-255) and alpha of a computed colour: rgb()/rgba(), or color(srgb …) as color-mix() serializes. */
function channels(c: string) {
  const n = c.match(/[\d.]+/g)!.map(Number);
  if (c.startsWith('color(')) return [...n.slice(0, 3).map((v) => v * 255), n[3] ?? 1];
  return [...n.slice(0, 3), n[3] ?? 1];
}

describe('SavingBar in the primary colour', () => {
  it('paints colors/primary/default with text/on/primary, light and dark, and passes axe (no plate)', async () => {
    for (const mode of MODES) {
      const el = await render(<SavingBar onSave={() => {}} onDiscard={() => {}} />, mode);
      const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
      expect(bar.classList.contains('ds-plate')).toBe(false);
      expect(bar.hasAttribute('data-rds-plate')).toBe(false);
      const style = getComputedStyle(bar);
      expect(style.backgroundColor).toBe(rgb(role('--colors-primary-default')));
      expect(style.color).toBe(rgb(role('--text-on-primary')));
      expect(await axeViolations(el)).toEqual([]);
      cleanup();
    }
  });

  it('Salvar is tone action fill and Descartar tone neutral ghost (no inverse), in the bar colours', async () => {
    for (const mode of MODES) {
      const el = await render(<SavingBar onSave={() => {}} onDiscard={() => {}} />, mode);
      const [discard, save] = [...el.querySelectorAll<HTMLElement>('button')];
      expect(save.className).toContain('rds-button--action');
      expect(save.className).toContain('rds-button--fill');
      expect(discard.className).toContain('rds-button--neutral');
      expect(discard.className).toContain('rds-button--ghost');
      expect(el.querySelector('[class*="inverse"]')).toBeNull();
      // savingbar/button/fill/background = text/on/primary, savingbar/button/fill/label = colors/primary/default.
      expect(getComputedStyle(save).backgroundColor).toBe(rgb(role('--text-on-primary')));
      expect(getComputedStyle(save).color).toBe(rgb(role('--colors-primary-default')));
      expect(getComputedStyle(discard).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(getComputedStyle(discard).color).toBe(rgb(role('--text-on-primary')));
      cleanup();
    }
  });

  it('hover: Salvar is its fill at 85% over the bar; Descartar the label colour at 15%; focus draws savingbar/focus/ring', async () => {
    await page.viewport(1280, 800);
    const el = await render(<SavingBar onSave={() => {}} onDiscard={() => {}} />);
    const [discard, save] = [...el.querySelectorAll<HTMLElement>('button')];
    const fill = rgb(role('--text-on-primary'));
    const bar = rgb(role('--colors-primary-default'));
    await userEvent.hover(save);
    const got = channels(getComputedStyle(save).backgroundColor);
    mix(fill, 0.85, bar).forEach((v, i) => expect(Math.abs(got[i] - v)).toBeLessThanOrEqual(1));
    await userEvent.hover(discard);
    const ghost = getComputedStyle(discard).backgroundColor;
    const [r, g, b, alpha] = channels(ghost);
    channels(fill).slice(0, 3).forEach((v, i) => expect(Math.abs([r, g, b][i] - v)).toBeLessThanOrEqual(1));
    expect(alpha).toBeCloseTo(0.15, 2);
    await userEvent.unhover(discard);
    await userEvent.tab();
    expect(document.activeElement).toBe(discard);
    expect(getComputedStyle(discard).outlineColor).toBe(fill);
  });

  it('saving: Salvar keeps its fill with the loader in the bar colour; Descartar is at 40% over the bar', async () => {
    await page.viewport(1280, 800);
    const el = await render(<SavingBar status="saving" onSave={() => {}} onDiscard={() => {}} />);
    const [discard, save] = [...el.querySelectorAll<HTMLElement>('button')];
    const fill = rgb(role('--text-on-primary'));
    const bar = rgb(role('--colors-primary-default'));
    const near = (c: string, want: number[]) =>
      channels(c).slice(0, 3).forEach((v, i) => expect(Math.abs(v - want[i])).toBeLessThanOrEqual(1));
    near(getComputedStyle(save).backgroundColor, channels(fill).slice(0, 3));
    near(getComputedStyle(save.querySelector('.rds-button__loader')!).color, channels(bar).slice(0, 3));
    near(getComputedStyle(discard).color, mix(fill, 0.4, bar));
  });

  it('a light brand (cyan #00aeef from generateRdsTheme): the bar repaints, Salvar takes text/on/primary, the 3 statuses pass axe, light and dark', async () => {
    const theme = generateRdsTheme({ name: 'ciano', brand: { primary: '#00aeef' }, fonts: { body: 'inter' } } as BrandDef);
    const house = { light: '', dark: '' };
    for (const mode of MODES) {
      await render(<span />, mode);
      house[mode] = role('--colors-primary-default');
    }
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
        const table = mode === 'dark' ? theme.dark : theme.light;
        const primary = table['--colors-primary-default'] ?? role('--colors-primary-default');
        const onPrimary = table['--text-on-primary'] ?? role('--text-on-primary');
        expect(rgb(role('--colors-primary-default'))).toBe(rgb(primary));
        expect(role('--colors-primary-default')).not.toBe(house[mode]);
        const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
        expect(getComputedStyle(bar).backgroundColor).toBe(rgb(primary));
        const [discard, save] = [...bar.querySelectorAll<HTMLElement>('.rds-button')];
        expect(getComputedStyle(save).backgroundColor).toBe(rgb(onPrimary));
        expect(getComputedStyle(save).color).toBe(rgb(primary));
        expect(getComputedStyle(discard).color).toBe(rgb(onPrimary));
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
    // The drawing is the message (here two lines, 48: Salvar shares the row), not stretched to the touch area.
    expect(button.getBoundingClientRect().height).toBe(button.querySelector('.rds-savingbar__text')!.getBoundingClientRect().height);
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
    expect(style.outlineColor).toBe(rgb(getComputedStyle(bar).getPropertyValue('--text-on-primary').trim()));
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
