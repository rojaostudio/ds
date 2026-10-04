import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { emitRdsCss, generateRdsTheme, type BrandDef } from '@rojaostudio/ds-core/generate';
import { Button } from './button';
import { FormActions, type FormActionsPlacement } from './form-actions';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

let brandStyle: HTMLStyleElement | null = null;
afterEach(async () => {
  cleanup();
  brandStyle?.remove();
  brandStyle = null;
  await page.viewport(1280, 800);
});

const PLACEMENTS: FormActionsPlacement[] = ['docked', 'floating'];

function Foot(props: { placement?: FormActionsPlacement; leading?: ReactNode; onCancel?: () => void }) {
  const { onCancel, ...rest } = props;
  return (
    <FormActions {...rest}>
      <Button tone="neutral" variant="ghost" onClick={onCancel}>Cancelar</Button>
      <Button tone="action">Criar produto</Button>
    </FormActions>
  );
}

/** Edge to edge, as at the foot of the screen (the test host has 16 of padding). */
const edge = (ui: ReactNode) => <div style={{ margin: '0 -16px' }}>{ui}</div>;

const shown = (el: Element) =>
  [...el.querySelectorAll<HTMLElement>('.rds-form-actions__actions > *')].filter((b) => getComputedStyle(b).display !== 'none');

/** What a shown action is called: its text, or the aria-label of the X. */
const names = (el: Element) => shown(el).map((b) => b.getAttribute('aria-label') ?? b.textContent);

/** A theme role as the shipped theme resolves it on the root, in the current mode. */
const role = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** The colour a CSS colour value computes to, on a probe. */
function computed(color: string, inside: Element = document.body) {
  const probe = document.createElement('span');
  probe.style.color = color;
  inside.appendChild(probe);
  const out = getComputedStyle(probe).color;
  probe.remove();
  return out;
}

describe.each(MODES)('FormActions (%s)', (mode) => {
  it('passes axe docked and floating, expanded (1280) and compact (390), with and without leading', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      for (const placement of PLACEMENTS) {
        const el = await render(
          <div style={{ display: 'grid', gap: 8 }}>
            <Foot placement={placement} />
            <Foot placement={placement} leading={<Button tone="neutral" variant="ghost">Pré-visualizar</Button>} />
          </div>,
          mode,
        );
        expect(await axeViolations(el), `${width} ${placement}`).toEqual([]);
      }
    }
  });

  it('passes axe in the brand (inside a .ds-plate), expanded and compact', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(
        <div className="ds-plate" style={{ background: 'var(--surface-page)', padding: 16 }}>
          <Foot />
        </div>,
        mode,
      );
      expect(await axeViolations(el), `${width}`).toEqual([]);
    }
  });
});

describe('FormActions behaviour', () => {
  it('sits on the shell: .rds-bottom-bar, sticky at the bottom, in the brand colour (bottom-bar/background), no hairline', async () => {
    for (const mode of MODES) {
      const el = await render(<Foot />, mode);
      const bar = el.querySelector<HTMLElement>('.rds-form-actions')!;
      expect(bar.classList.contains('rds-bottom-bar')).toBe(true);
      const style = getComputedStyle(bar);
      expect(style.position).toBe('sticky');
      expect(style.bottom).toBe('0px');
      expect(style.backgroundColor).toBe(computed(role('--colors-primary-default')));
      expect(style.color).toBe(computed(role('--text-on-primary')));
      expect(style.borderTopWidth).toBe('0px');
      expect(style.boxShadow).toBe('none');
      cleanup();
    }
  });

  it('expanded at 1280: one band 68 tall, 12 24 padding, Cancelar then the primary on the right, 8 apart', async () => {
    await page.viewport(1280, 800);
    const el = await render(edge(<Foot />));
    const bar = el.querySelector<HTMLElement>('.rds-form-actions')!;
    expect(bar.getBoundingClientRect().height).toBe(68);
    expect(getComputedStyle(bar).padding).toBe('12px 24px');
    const actions = shown(bar);
    expect(actions.map((b) => b.textContent)).toEqual(['Cancelar', 'Criar produto']);
    const [cancel, primary] = actions.map((b) => b.getBoundingClientRect());
    expect(cancel.top).toBe(primary.top);
    expect(primary.left - cancel.right).toBe(8);
    expect(primary.right).toBe(bar.getBoundingClientRect().right - 24);
  });

  it('compact at 390: one row 64 tall (10 + 44 + 10, plus the safe area), the X (Cancelar) and the primary on the right, 8 apart', async () => {
    await page.viewport(390, 800);
    const el = await render(edge(<Foot />));
    const bar = el.querySelector<HTMLElement>('.rds-form-actions')!;
    expect(bar.getBoundingClientRect().height).toBe(64);
    expect(getComputedStyle(bar).paddingTop).toBe('10px');
    // env(safe-area-inset-bottom) is 0 here: 10 + 0.
    expect(getComputedStyle(bar).paddingBottom).toBe('10px');
    expect(names(bar)).toEqual(['Cancelar', 'Criar produto']);
    // The labelled Cancelar is display: none (out of the tab order and the accessibility tree): the X stands for it.
    const cancel = [...bar.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent === 'Cancelar')!;
    expect(getComputedStyle(cancel).display).toBe('none');
    const [x, primary] = shown(bar).map((b) => b.getBoundingClientRect());
    expect([x.width, x.height]).toEqual([44, 44]);
    expect(primary.height).toBe(44);
    expect(x.top).toBe(primary.top);
    expect(primary.left - x.right).toBe(8);
    expect(primary.right).toBe(bar.getBoundingClientRect().right - 24);
    expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
  });

  it('compact keeps the X (the first child) and the primary (the last); the actions between them leave', async () => {
    await page.viewport(390, 800);
    const el = await render(
      <FormActions>
        <Button tone="neutral" variant="ghost">Cancelar</Button>
        <Button tone="neutral" variant="ghost">Salvar rascunho</Button>
        <Button tone="action">Publicar</Button>
      </FormActions>,
    );
    expect(names(el)).toEqual(['Cancelar', 'Publicar']);
    await page.viewport(1280, 800);
    expect(names(el)).toEqual(['Cancelar', 'Salvar rascunho', 'Publicar']);
  });

  it('with one child there is no Cancelar and no X, expanded or compact', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(
        <FormActions>
          <Button tone="action">Concluir</Button>
        </FormActions>,
      );
      expect(el.querySelector('.rds-form-actions__cancel-icon')).toBeNull();
      expect(names(el)).toEqual(['Concluir']);
    }
  });

  it('keeps reading order: Cancelar first, the primary last, in the page and in the focus order', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Foot />);
    expect(names(el)).toEqual(['Cancelar', 'Criar produto']);
    await userEvent.tab();
    expect(document.activeElement!.textContent).toBe('Cancelar');
    await userEvent.tab();
    expect(document.activeElement!.textContent).toBe('Criar produto');
  });

  it('docked at 1280 and 390: the container width, square, no shadow, no margin', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(edge(<Foot placement="docked" />));
      const bar = el.querySelector<HTMLElement>('.rds-form-actions')!;
      const style = getComputedStyle(bar);
      expect(bar.classList.contains('rds-bottom-bar--docked')).toBe(true);
      expect(bar.getBoundingClientRect().width).toBe(width);
      expect(style.borderTopLeftRadius).toBe('0px');
      expect(style.boxShadow).toBe('none');
      expect(style.marginBottom).toBe('0px');
      expect(style.bottom).toBe('0px');
    }
  });

  it('floating at 1280: hugs the actions (12 + Cancelar + 8 + primary + 12), in the bottom right corner 24 off, 64 tall, radius/container and elevation/overlay', async () => {
    await page.viewport(1280, 800);
    const el = await render(edge(<Foot placement="floating" />));
    const bar = el.querySelector<HTMLElement>('.rds-form-actions')!;
    const style = getComputedStyle(bar);
    const box = bar.getBoundingClientRect();
    const [cancel, primary] = shown(bar).map((b) => b.getBoundingClientRect());
    expect(box.width).toBeCloseTo(12 + cancel.width + 8 + primary.width + 12, 0);
    expect(cancel.left - box.left).toBe(12);
    expect(box.right - primary.right).toBe(12);
    expect(box.right).toBe(1280 - 24);
    expect(box.height).toBe(64);
    expect(style.padding).toBe('10px 12px');
    expect(style.marginBottom).toBe('24px');
    expect(style.bottom).toBe('24px');
    expect(style.borderTopLeftRadius).toBe('12px');
    expect(style.borderBottomRightRadius).toBe('12px');
    expect(style.boxShadow).not.toBe('none');
  });

  it('floating sits in the bottom right corner of its own scrolling container: beside a sidebar it never covers it', async () => {
    await page.viewport(1280, 600);
    const el = await render(
      edge(
        <div style={{ display: 'flex', height: 500 }}>
          <nav aria-label="Menu" style={{ width: 260, flex: 'none' }} />
          <div data-testid="scroller" style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
            <div style={{ height: 1200 }} />
            <Foot placement="floating" />
          </div>
        </div>,
      ),
    );
    const scroller = el.querySelector<HTMLElement>('[data-testid="scroller"]')!;
    const nav = el.querySelector('nav')!.getBoundingClientRect();
    const bar = el.querySelector<HTMLElement>('.rds-form-actions')!;
    const frame = scroller.getBoundingClientRect();
    const inner = frame.left + scroller.clientLeft + scroller.clientWidth;
    // Sticky at the bottom of the scrolling container while the end of its content is still far below.
    for (const top of [0, scroller.scrollHeight]) {
      scroller.scrollTop = top;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const box = bar.getBoundingClientRect();
      expect(frame.top + scroller.clientHeight - box.bottom, `scrollTop ${top}`).toBe(24);
      expect(inner - box.right, `scrollTop ${top}`).toBe(24);
      expect(box.left).toBeGreaterThan(nav.right);
    }
  });

  it('floating in a narrow container never overflows it: at most its width minus 24 at each side', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <div style={{ width: 300 }}>
        <Foot placement="floating" leading={<Button tone="neutral" variant="ghost">Pré-visualizar</Button>} />
      </div>,
    );
    const host = el.firstElementChild!.getBoundingClientRect();
    const bar = el.querySelector<HTMLElement>('.rds-form-actions')!.getBoundingClientRect();
    expect(bar.width).toBeLessThanOrEqual(300 - 48);
    expect(host.right - bar.right).toBe(24);
  });

  it('compact at 390: the X is Cancelar, named by its label, calls its onClick, takes the focus with the bar ring, hover at 15%', async () => {
    await page.viewport(390, 800);
    const onCancel = vi.fn();
    const el = await render(<Foot onCancel={onCancel} />);
    const [x, primary] = shown(el);
    expect(x.classList.contains('rds-form-actions__cancel-icon')).toBe(true);
    expect(x.className).toContain('rds-button--neutral');
    expect(x.className).toContain('rds-button--ghost');
    expect(x.className).toContain('rds-button--md');
    expect(x.getAttribute('aria-label')).toBe('Cancelar');
    expect(x.textContent).toBe('');
    x.click();
    expect(onCancel).toHaveBeenCalledOnce();
    const label = computed(role('--text-on-primary'));
    expect(getComputedStyle(x).color).toBe(label);
    await userEvent.hover(x);
    const alpha = Number(getComputedStyle(x).backgroundColor.match(/[\d.]+/g)!.at(-1));
    expect(alpha).toBeCloseTo(0.15, 2);
    await userEvent.unhover(x);
    await userEvent.tab();
    expect(document.activeElement).toBe(x);
    expect(getComputedStyle(x).outlineColor).toBe(label);
    await userEvent.tab();
    expect(document.activeElement).toBe(primary);
  });

  it('compact: the X takes aria-label and disabled from the Cancelar child', async () => {
    await page.viewport(390, 800);
    const onClick = vi.fn();
    const el = await render(
      <FormActions>
        <Button tone="neutral" variant="ghost" aria-label="Voltar sem criar" disabled onClick={onClick}>
          <span>Voltar</span>
        </Button>
        <Button tone="action">Criar</Button>
      </FormActions>,
    );
    const [x] = shown(el);
    expect(x.getAttribute('aria-label')).toBe('Voltar sem criar');
    expect(x.getAttribute('aria-disabled')).toBe('true');
    x.click();
    expect(onClick).not.toHaveBeenCalled();
    cleanup();
    const nested = await render(
      <FormActions>
        <Button tone="neutral" variant="ghost">
          <span>Sair</span> agora
        </Button>
        <Button tone="action">Criar</Button>
      </FormActions>,
    );
    expect(shown(nested)[0].getAttribute('aria-label')).toBe('Sair agora');
  });

  it('floating at 390 is exactly docked: no radius, no shadow, no margin, the full width, 64 tall', async () => {
    await page.viewport(390, 800);
    const el = await render(
      edge(
        <div style={{ display: 'grid' }}>
          <Foot placement="docked" />
          <Foot placement="floating" />
        </div>,
      ),
    );
    const [docked, floating] = [...el.querySelectorAll<HTMLElement>('.rds-form-actions')];
    expect(floating.classList.contains('rds-bottom-bar--floating')).toBe(true);
    const [d, f] = [getComputedStyle(docked), getComputedStyle(floating)];
    for (const prop of ['borderTopLeftRadius', 'borderBottomRightRadius', 'boxShadow', 'marginLeft', 'marginRight', 'marginBottom', 'bottom', 'padding', 'maxWidth'] as const)
      expect(f[prop], prop).toBe(d[prop]);
    expect(f.borderTopLeftRadius).toBe('0px');
    expect(f.boxShadow).toBe('none');
    expect(f.marginBottom).toBe('0px');
    expect(floating.getBoundingClientRect().width).toBe(390);
    expect(floating.getBoundingClientRect().height).toBe(64);
  });

  it('leading on the left reserves 44: the actions do not move when its control comes and goes', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(
        edge(
          <div style={{ display: 'grid' }}>
            <Foot leading={null} />
            <Foot leading={<button type="button" aria-label="Pré-visualizar" style={{ width: 44, height: 44 }} />} />
            <Foot />
          </div>,
        ),
      );
      const [empty, filled, none] = [...el.querySelectorAll<HTMLElement>('.rds-form-actions')];
      const slot = empty.querySelector<HTMLElement>('.rds-bottom-bar__leading')!;
      expect(slot.getBoundingClientRect().width).toBe(44);
      // No height of its own: empty, it is 44 wide and 0 tall (the Figma slot with showLeading on and nothing in it).
      expect(slot.getBoundingClientRect().height).toBe(0);
      expect(slot.getBoundingClientRect().left).toBe(empty.getBoundingClientRect().left + 24);
      expect(filled.querySelector<HTMLElement>('.rds-bottom-bar__leading')!.getBoundingClientRect().width).toBe(44);
      // Without leading there is no slot at all.
      expect(none.querySelector('.rds-bottom-bar__leading')).toBeNull();
      const right = (bar: HTMLElement) => shown(bar).map((b) => b.getBoundingClientRect().left);
      expect(right(filled)).toEqual(right(empty));
      expect(empty.getBoundingClientRect().height).toBe(width === 1280 ? 68 : 64);
      expect(filled.getBoundingClientRect().height).toBe(width === 1280 ? 68 : 64);
    }
  });

  it('a wider leading control grows the slot past 44 and stays on the left', async () => {
    await page.viewport(1280, 800);
    const el = await render(edge(<Foot leading={<Button tone="neutral" variant="ghost">Pré-visualizar</Button>} />));
    const bar = el.querySelector<HTMLElement>('.rds-form-actions')!;
    const slot = bar.querySelector<HTMLElement>('.rds-bottom-bar__leading')!.getBoundingClientRect();
    expect(slot.width).toBeGreaterThan(44);
    const [cancel] = shown(bar).map((b) => b.getBoundingClientRect());
    expect(slot.right).toBeLessThanOrEqual(cancel.left);
  });

  it('the Buttons take the bar colours: the primary bottom-bar/button/fill/*, Cancelar bottom-bar/button/ghost/label, the ring bottom-bar/focus/ring', async () => {
    await page.viewport(1280, 800);
    for (const mode of MODES) {
      const el = await render(<Foot />, mode);
      const [cancel, primary] = shown(el);
      expect(getComputedStyle(primary).backgroundColor).toBe(computed(role('--text-on-primary')));
      expect(getComputedStyle(primary).color).toBe(computed(role('--colors-primary-default')));
      expect(getComputedStyle(cancel).color).toBe(computed(role('--text-on-primary')));
      await userEvent.tab();
      expect(document.activeElement).toBe(cancel);
      expect(getComputedStyle(cancel).outlineColor).toBe(computed(role('--text-on-primary')));
      cleanup();
    }
  });

  it('a light brand (cyan #00aeef from generateRdsTheme): passes axe, expanded and compact, light and dark, and on hover', async () => {
    const theme = generateRdsTheme({ name: 'ciano', brand: { primary: '#00aeef' }, fonts: { body: 'inter' } } as BrandDef);
    brandStyle = document.createElement('style');
    brandStyle.textContent = emitRdsCss(theme);
    document.head.appendChild(brandStyle);
    for (const mode of MODES) {
      for (const width of [1280, 390]) {
        await page.viewport(width, 800);
        const el = await render(<Foot placement="floating" />, mode);
        expect(await axeViolations(el)).toEqual([]);
        const primary = [...el.querySelectorAll('button')].find((b) => b.textContent === 'Criar produto')!;
        await userEvent.hover(primary);
        expect(await axeViolations(el), `${mode} ${width} hover`).toEqual([]);
        await userEvent.unhover(el);
      }
    }
  });
});
