import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { emitRdsCss, generateRdsTheme, type BrandDef } from '@rojaostudio/ds-core/generate';
import { Button } from './button';
import { SavingBar, type SavingBarPlacement, type SavingBarStatus } from './saving-bar';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

let brandStyle: HTMLStyleElement | null = null;
afterEach(async () => {
  cleanup();
  brandStyle?.remove();
  brandStyle = null;
  await page.viewport(1280, 800);
});

const STATUSES: SavingBarStatus[] = ['unsaved', 'saving', 'error'];

/** The buttons on screen (the labelled Descartar expanded, the undo IconButton compact; the other is display: none). */
const visible = (root: Element) => [...root.querySelectorAll<HTMLElement>('button')].filter((b) => b.getClientRects().length > 0);
const PLACEMENTS: SavingBarPlacement[] = ['docked', 'floating'];

describe.each(MODES)('SavingBar (%s)', (mode) => {
  it('every status passes axe, docked and floating, expanded (1280) and compact (390)', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      for (const placement of PLACEMENTS) {
        const el = await render(
          <div style={{ display: 'grid', gap: 8 }}>
            {STATUSES.map((status) => (
              <SavingBar
                key={status}
                status={status}
                placement={placement}
                aria-label={`Salvar (${status})`}
                onSave={() => {}}
                onDiscard={() => {}}
              />
            ))}
          </div>,
          mode,
        );
        expect(await axeViolations(el), `${width} ${placement}`).toEqual([]);
      }
    }
  });

  it('passes axe with a leading control', async () => {
    const el = await render(
      <SavingBar leading={<Button tone="neutral" variant="ghost">Ver alterações</Button>} onSave={() => {}} onDiscard={() => {}} />,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('every status passes axe in the brand (inside a .ds-plate), expanded and compact', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(
        <div className="ds-plate" style={{ background: 'var(--surface-page)', padding: 16, display: 'grid', gap: 8 }}>
          {STATUSES.map((status) => (
            <SavingBar key={status} status={status} aria-label={`Salvar (${status})`} onSave={() => {}} onDiscard={() => {}} />
          ))}
        </div>,
        mode,
      );
      expect(await axeViolations(el), `${width}`).toEqual([]);
    }
  });
});

describe('SavingBar behaviour', () => {
  it('unsaved: message, Descartar and Salvar', async () => {
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    const el = await render(<SavingBar onSave={onSave} onDiscard={onDiscard} />);
    expect(el.querySelector('[role="status"]')!.textContent).toBe('Alterações não salvas');
    const [discard, save] = visible(el);
    expect([discard.textContent, save.textContent]).toEqual(['Descartar', 'Salvar']);
    discard.click();
    save.click();
    expect(onDiscard).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('without onDiscard there is no Descartar (showDiscard off)', async () => {
    const el = await render(<SavingBar onSave={() => {}} />);
    expect(visible(el).map((b) => b.textContent)).toEqual(['Salvar']);
  });

  it('saving: says Salvando…; Salvar is in loading (savingLabel, aria-busy) and Descartar disabled; both ignore clicks', async () => {
    await page.viewport(1280, 800);
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    const el = await render(<SavingBar status="saving" onSave={onSave} onDiscard={onDiscard} />);
    expect(el.querySelector('[role="status"]')!.textContent).toBe('Salvando…');
    const [discard, save] = visible(el);
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
      // Compact, the undo IconButton draws its icon too: that is not an indicator.
      const shown = [...bar.querySelectorAll<SVGElement>('svg')].filter(
        (x) => x.getClientRects().length > 0 && !x.closest('.rds-savingbar__discard-icon'),
      );
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

  it('at 390 (compact): one row, 64 tall, the message on the left, Descartar as the undo IconButton and Salvar on the right', async () => {
    await page.viewport(390, 800);
    const el = await render(
      <div style={{ width: 390 }}>
        <SavingBar onSave={() => {}} onDiscard={() => {}} />
      </div>,
    );
    const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
    expect(getComputedStyle(bar).flexDirection).toBe('row');
    expect(bar.getBoundingClientRect().height).toBe(64);
    expect(getComputedStyle(bar).paddingTop).toBe('10px');
    // env(safe-area-inset-bottom) is 0 here: 10 + 0.
    expect(getComputedStyle(bar).paddingBottom).toBe('10px');
    const discard = bar.querySelector<HTMLElement>('.rds-savingbar__discard')!;
    expect(getComputedStyle(discard).display).toBe('none');
    const shown = visible(bar);
    expect(shown.map((b) => b.getAttribute('aria-label') ?? b.textContent)).toEqual(['Descartar', 'Salvar']);
    const [undo, save] = shown.map((b) => b.getBoundingClientRect());
    expect([undo.width, undo.height]).toEqual([44, 44]);
    expect(save.left - undo.right).toBe(8);
    expect(undo.top).toBe(save.top);
    expect(save.height).toBe(44);
    const msg = bar.querySelector<HTMLElement>('.rds-savingbar__message')!.getBoundingClientRect();
    // One line: the message beside the actions, on their left, centred with them.
    expect(msg.right).toBeLessThanOrEqual(undo.left);
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
    const [undo, save] = visible(bar);
    expect(save.getBoundingClientRect().height).toBe(44);
    expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(undo.getBoundingClientRect().left);
    expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
  });

  it('at 1280 (expanded): 12 24 padding (68 tall), the message, Descartar and Salvar in one row', async () => {
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
    const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
    expect(getComputedStyle(bar).flexDirection).toBe('row');
    const msg = el.querySelector<HTMLElement>('.rds-savingbar__message')!;
    expect(getComputedStyle(msg).minWidth).toBe('160px');
    expect(getComputedStyle(msg).flexBasis).toBe('160px');
    const actions = el.querySelector<HTMLElement>('.rds-savingbar__actions')!.getBoundingClientRect();
    expect(actions.top).toBeLessThan(msg.getBoundingClientRect().bottom);
  });

  it('at 390 (compact): the undo IconButton is Descartar: named discardLabel, calls onDiscard, takes the focus with the bar ring, its hover the label colour at 15%', async () => {
    await page.viewport(390, 800);
    const onDiscard = vi.fn();
    const el = await render(<SavingBar discardLabel="Desfazer tudo" onSave={() => {}} onDiscard={onDiscard} />);
    const [undo, save] = visible(el);
    expect(undo.classList.contains('rds-savingbar__discard-icon')).toBe(true);
    expect(undo.className).toContain('rds-button--neutral');
    expect(undo.className).toContain('rds-button--ghost');
    expect(undo.className).toContain('rds-button--md');
    expect(undo.getAttribute('aria-label')).toBe('Desfazer tudo');
    expect(undo.textContent).toBe('');
    expect(undo.querySelector('svg')).not.toBeNull();
    // The labelled Descartar is display: none: out of the tab order and the accessibility tree.
    expect(getComputedStyle(el.querySelector('.rds-savingbar__discard')!).display).toBe('none');
    undo.click();
    expect(onDiscard).toHaveBeenCalledOnce();
    const fill = rgb(role('--text-on-primary'));
    expect(getComputedStyle(undo).color).toBe(fill);
    await userEvent.hover(undo);
    const [, , , alpha] = channels(getComputedStyle(undo).backgroundColor);
    expect(alpha).toBeCloseTo(0.15, 2);
    await userEvent.unhover(undo);
    await userEvent.tab();
    expect(document.activeElement).toBe(undo);
    expect(getComputedStyle(undo).outlineColor).toBe(fill);
    await userEvent.tab();
    expect(document.activeElement).toBe(save);
  });

  it('at 390 (compact) while saving: the undo IconButton is disabled and ignores clicks', async () => {
    await page.viewport(390, 800);
    const onDiscard = vi.fn();
    const el = await render(<SavingBar status="saving" onSave={() => {}} onDiscard={onDiscard} />);
    const [undo] = visible(el);
    expect(undo.getAttribute('aria-label')).toBe('Descartar');
    expect(undo.getAttribute('aria-disabled')).toBe('true');
    undo.click();
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it('at 390 (compact) without onDiscard there is no undo IconButton', async () => {
    await page.viewport(390, 800);
    const el = await render(<SavingBar onSave={() => {}} />);
    expect(el.querySelector('.rds-savingbar__discard-icon')).toBeNull();
    expect(visible(el).map((b) => b.textContent)).toEqual(['Salvar']);
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
      const [discard, save] = visible(el);
      expect(save.className).toContain('rds-button--action');
      expect(save.className).toContain('rds-button--fill');
      expect(discard.className).toContain('rds-button--neutral');
      expect(discard.className).toContain('rds-button--ghost');
      expect(el.querySelector('[class*="inverse"]')).toBeNull();
      // bottom-bar/button/fill/background = text/on/primary, bottom-bar/button/fill/label = colors/primary/default.
      expect(getComputedStyle(save).backgroundColor).toBe(rgb(role('--text-on-primary')));
      expect(getComputedStyle(save).color).toBe(rgb(role('--colors-primary-default')));
      expect(getComputedStyle(discard).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(getComputedStyle(discard).color).toBe(rgb(role('--text-on-primary')));
      cleanup();
    }
  });

  it('hover: Salvar is its fill at 85% over the bar; Descartar the label colour at 15%; focus draws bottom-bar/focus/ring', async () => {
    await page.viewport(1280, 800);
    const el = await render(<SavingBar onSave={() => {}} onDiscard={() => {}} />);
    const [discard, save] = visible(el);
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
    const [discard, save] = visible(el);
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
        const [discard, save] = visible(bar);
        expect(getComputedStyle(save).backgroundColor).toBe(rgb(onPrimary));
        expect(getComputedStyle(save).color).toBe(rgb(primary));
        expect(getComputedStyle(discard).color).toBe(rgb(onPrimary));
        expect(await axeViolations(el)).toEqual([]);
        cleanup();
      }
    }
  });
});


/** Edge to edge, as at the foot of the screen (the test host has 16 of padding). */
const edge = (ui: ReactNode) => <div style={{ margin: '0 -16px' }}>{ui}</div>;

describe('SavingBar on the shell (.bottom-bar)', () => {
  it('is the private .rds-bottom-bar, sticky at the bottom, a region named Salvar alterações', async () => {
    const el = await render(<SavingBar onSave={() => {}} />);
    const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
    expect(bar.classList.contains('rds-bottom-bar')).toBe(true);
    expect(bar.getAttribute('role')).toBe('region');
    expect(bar.getAttribute('aria-label')).toBe('Salvar alterações');
    expect(getComputedStyle(bar).position).toBe('sticky');
    expect(getComputedStyle(bar).bottom).toBe('0px');
  });

  it('has no details button and no chevron left (the details moved to the project, in leading if needed)', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      for (const status of STATUSES) {
        const el = await render(<SavingBar status={status} onSave={() => {}} onDiscard={() => {}} />);
        expect(el.querySelector('[aria-expanded], [aria-controls], .rds-savingbar__details')).toBeNull();
        const icons = [...el.querySelectorAll('.rds-savingbar__message svg')];
        expect(icons).toHaveLength(status === 'error' ? 1 : 0);
      }
    }
  });

  it('docked at 1280 and 390: the container width, square, no shadow, no margin; 68 and 64 tall', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(edge(<SavingBar placement="docked" onSave={() => {}} onDiscard={() => {}} />));
      const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
      const style = getComputedStyle(bar);
      expect(bar.getBoundingClientRect().width).toBe(width);
      expect(bar.getBoundingClientRect().height).toBe(width === 1280 ? 68 : 64);
      expect(style.borderTopLeftRadius).toBe('0px');
      expect(style.boxShadow).toBe('none');
      expect(style.marginBottom).toBe('0px');
    }
  });

  it('floating at 1280: hugs the message and the actions, in the bottom right corner (24 off), 64 tall, 10 12 padding, radius/container, elevation/overlay', async () => {
    await page.viewport(1280, 800);
    const el = await render(edge(<SavingBar placement="floating" onSave={() => {}} onDiscard={() => {}} />));
    const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
    const box = bar.getBoundingClientRect();
    const style = getComputedStyle(bar);
    // Its content's width: 12 + the message + 16 + Descartar + 8 + Salvar + 12, far less than the 1280 of the page.
    const msg = bar.querySelector<HTMLElement>('.rds-savingbar__message')!.getBoundingClientRect();
    const actions = bar.querySelector<HTMLElement>('.rds-savingbar__actions')!.getBoundingClientRect();
    expect(box.width).toBeCloseTo(12 + msg.width + 16 + actions.width + 12, 0);
    expect(box.width).toBeLessThan(600);
    expect(box.right).toBe(1280 - 24);
    expect(box.height).toBe(64);
    expect(style.padding).toBe('10px 12px');
    expect(style.width).not.toBe('768px');
    expect(style.maxWidth).toBe('calc(100% - 48px)');
    expect(style.bottom).toBe('24px');
    expect(style.marginBottom).toBe('24px');
    expect(style.borderTopLeftRadius).toBe('12px');
    expect(style.borderBottomRightRadius).toBe('12px');
    expect(style.boxShadow).not.toBe('none');
    expect(visible(bar).map((b) => b.textContent)).toEqual(['Descartar', 'Salvar']);
  });

  it('floating at 1280 keeps at least 320 wide (Figma: mínimo 320), with only Salvar and a short message', async () => {
    await page.viewport(1280, 800);
    const el = await render(edge(<SavingBar placement="floating" message="Pendente" onSave={() => {}} />));
    const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
    expect(getComputedStyle(bar).minWidth).toBe('320px');
    expect(bar.getBoundingClientRect().width).toBe(320);
    expect(bar.getBoundingClientRect().right).toBe(1280 - 24);
  });

  it('floating at 390 is exactly docked: no radius, no shadow, no margin, the full width, 64 tall', async () => {
    await page.viewport(390, 800);
    const el = await render(
      edge(
        <div style={{ display: 'grid' }}>
          <SavingBar placement="docked" onSave={() => {}} />
          <SavingBar placement="floating" onSave={() => {}} />
        </div>,
      ),
    );
    const [docked, floating] = [...el.querySelectorAll<HTMLElement>('.rds-savingbar')];
    const [d, f] = [getComputedStyle(docked), getComputedStyle(floating)];
    for (const prop of ['borderTopLeftRadius', 'borderBottomRightRadius', 'boxShadow', 'marginLeft', 'marginRight', 'marginBottom', 'bottom', 'padding', 'maxWidth'] as const)
      expect(f[prop], prop).toBe(d[prop]);
    expect(f.borderTopLeftRadius).toBe('0px');
    expect(f.boxShadow).toBe('none');
    expect(floating.getBoundingClientRect().width).toBe(390);
    expect(floating.getBoundingClientRect().height).toBe(64);
  });

  it('leading reserves 44 on the left: the message and the buttons do not move when its control comes and goes', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(
        edge(
          <div style={{ display: 'grid' }}>
            <SavingBar leading={null} onSave={() => {}} onDiscard={() => {}} />
            <SavingBar
              leading={<button type="button" aria-label="Ver alterações" style={{ width: 44, height: 44 }} />}
              onSave={() => {}}
              onDiscard={() => {}}
            />
            <SavingBar onSave={() => {}} onDiscard={() => {}} />
          </div>,
        ),
      );
      const [empty, filled, none] = [...el.querySelectorAll<HTMLElement>('.rds-savingbar')];
      const slot = (bar: HTMLElement) => bar.querySelector<HTMLElement>('.rds-bottom-bar__leading');
      expect(slot(empty)!.getBoundingClientRect().width).toBe(44);
      expect(slot(filled)!.getBoundingClientRect().width).toBe(44);
      expect(slot(none)).toBeNull();
      const message = (bar: HTMLElement) => bar.querySelector<HTMLElement>('.rds-savingbar__message')!.getBoundingClientRect();
      // The message starts after the slot and the gap: 24 + 44 + 16.
      expect(message(empty).left - empty.getBoundingClientRect().left).toBe(24 + 44 + 16);
      expect(message(filled).left).toBe(message(empty).left);
      const save = (bar: HTMLElement) => [...bar.querySelectorAll<HTMLElement>('.rds-button')].pop()!.getBoundingClientRect().left;
      expect(save(filled)).toBe(save(empty));
      // 10 (12 expanded) above and below the taller of the 44 controls and the message: at 390, with the slot and the
      // undo IconButton, the default message takes its 2 lines (48), so 68, as the Figma compact frame (HUG).
      const lines = message(empty).height;
      expect(empty.getBoundingClientRect().height).toBe(width === 1280 ? 68 : 20 + Math.max(44, lines));
      expect(filled.getBoundingClientRect().height).toBe(empty.getBoundingClientRect().height);
      expect(lines).toBeLessThanOrEqual(48);
    }
  });
});
