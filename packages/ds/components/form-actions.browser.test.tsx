import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
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

function Foot(props: { placement?: FormActionsPlacement; leading?: ReactNode }) {
  return (
    <FormActions {...props}>
      <Button tone="neutral" variant="ghost">Cancelar</Button>
      <Button tone="action">Criar produto</Button>
    </FormActions>
  );
}

/** Edge to edge, as at the foot of the screen (the test host has 16 of padding). */
const edge = (ui: ReactNode) => <div style={{ margin: '0 -16px' }}>{ui}</div>;

const shown = (el: Element) =>
  [...el.querySelectorAll<HTMLElement>('.rds-form-actions__actions > *')].filter((b) => getComputedStyle(b).display !== 'none');

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

  it('compact at 390: one row 64 tall (10 + 44 + 10, plus the safe area), only the primary, on the right', async () => {
    await page.viewport(390, 800);
    const el = await render(edge(<Foot />));
    const bar = el.querySelector<HTMLElement>('.rds-form-actions')!;
    expect(bar.getBoundingClientRect().height).toBe(64);
    expect(getComputedStyle(bar).paddingTop).toBe('10px');
    // env(safe-area-inset-bottom) is 0 here: 10 + 0.
    expect(getComputedStyle(bar).paddingBottom).toBe('10px');
    const actions = shown(bar);
    expect(actions.map((b) => b.textContent)).toEqual(['Criar produto']);
    // Cancelar is display: none (out of the tab order and the accessibility tree): the way out is the topbar's X.
    const cancel = [...bar.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent === 'Cancelar')!;
    expect(getComputedStyle(cancel).display).toBe('none');
    const primary = actions[0].getBoundingClientRect();
    expect(primary.height).toBe(44);
    expect(primary.right).toBe(bar.getBoundingClientRect().right - 24);
    expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
  });

  it('compact keeps only the last child, however many actions there are', async () => {
    await page.viewport(390, 800);
    const el = await render(
      <FormActions>
        <Button tone="neutral" variant="ghost">Cancelar</Button>
        <Button tone="neutral" variant="ghost">Salvar rascunho</Button>
        <Button tone="action">Publicar</Button>
      </FormActions>,
    );
    expect(shown(el).map((b) => b.textContent)).toEqual(['Publicar']);
    await page.viewport(1280, 800);
    expect(shown(el).map((b) => b.textContent)).toEqual(['Cancelar', 'Salvar rascunho', 'Publicar']);
  });

  it('keeps reading order: Cancelar first, the primary last, in the page and in the focus order', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Foot />);
    expect([...el.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Cancelar', 'Criar produto']);
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

  it('floating at 1280: off the foot by 24, at most 768, centred, radius/container and elevation/overlay', async () => {
    await page.viewport(1280, 800);
    const el = await render(edge(<Foot placement="floating" />));
    const bar = el.querySelector<HTMLElement>('.rds-form-actions')!;
    const style = getComputedStyle(bar);
    const box = bar.getBoundingClientRect();
    expect(box.width).toBe(768);
    expect(box.left).toBe((1280 - 768) / 2);
    expect(style.marginBottom).toBe('24px');
    expect(style.bottom).toBe('24px');
    expect(style.borderTopLeftRadius).toBe('12px');
    expect(style.borderBottomRightRadius).toBe('12px');
    expect(style.boxShadow).not.toBe('none');
    expect(box.height).toBe(68);
  });

  it('floating in a container narrower than 768 + 48 keeps 24 at each side', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <div style={{ width: 700 }}>
        <Foot placement="floating" />
      </div>,
    );
    const host = el.firstElementChild!.getBoundingClientRect();
    const bar = el.querySelector<HTMLElement>('.rds-form-actions')!.getBoundingClientRect();
    expect(bar.width).toBe(700 - 48);
    expect(bar.left - host.left).toBe(24);
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
      const [cancel, primary] = [...el.querySelectorAll<HTMLElement>('button')];
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
