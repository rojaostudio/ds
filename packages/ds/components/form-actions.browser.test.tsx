import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { emitRdsCss, generateRdsTheme, type BrandDef } from '@rojaostudio/ds-core/generate';
import { Button } from './button';
import { FormActions } from './form-actions';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

let brandStyle: HTMLStyleElement | null = null;
afterEach(async () => {
  cleanup();
  brandStyle?.remove();
  brandStyle = null;
  await page.viewport(1280, 800);
});

const HELPER = 'Falta preço e prazo';

const SHORT = 'Falta o preço';

function Bar(props: { onDetails?: () => void; detailsExpanded?: boolean; helper?: string; showHelper?: boolean }) {
  return (
    <FormActions layout="bar" helper={HELPER} detailsControls="o-que-falta" {...props}>
      <Button tone="neutral" variant="ghost">Cancelar</Button>
      <Button tone="action">Criar produto</Button>
    </FormActions>
  );
}

const shown = (el: Element) =>
  [...el.querySelectorAll<HTMLElement>('.rds-form-actions__actions > *')].filter((b) => getComputedStyle(b).display !== 'none');

describe.each(MODES)('FormActions (%s)', (mode) => {
  it('passes axe inline with a helper and stacked', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
        <FormActions helper="Você pode editar depois.">
          <Button tone="action" variant="ghost">Cancelar</Button>
          <Button tone="action">Publicar</Button>
        </FormActions>
        <FormActions layout="stacked">
          <Button tone="action" variant="ghost">Cancelar</Button>
          <Button tone="action">Publicar</Button>
        </FormActions>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('bar passes axe in the 4 cases (showHelper × onDetails), expanded (1280) and compact (390)', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      for (const showHelper of [true, false]) {
        for (const details of [false, true]) {
          const el = await render(<Bar showHelper={showHelper} onDetails={details ? () => {} : undefined} />, mode);
          expect(await axeViolations(el), `${width} showHelper=${showHelper} details=${details}`).toEqual([]);
        }
      }
    }
  });

  it('bar passes axe expanded (1280) and compact (390), with and without details', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(
        <div style={{ display: 'grid', gap: 8 }}>
          <Bar />
          <Bar onDetails={() => {}} />
        </div>,
        mode,
      );
      expect(await axeViolations(el)).toEqual([]);
    }
  });
});

describe('FormActions behaviour', () => {
  it('stacked puts the primary first, in the page and in the focus order', async () => {
    const el = await render(
      <FormActions layout="stacked">
        <Button variant="ghost">Cancelar</Button>
        <Button>Publicar</Button>
      </FormActions>,
    );
    const labels = [...el.querySelectorAll('button')].map((b) => b.textContent);
    expect(labels).toEqual(['Publicar', 'Cancelar']);
  });

  it('inline keeps reading order and shows the helper only when given', async () => {
    const el = await render(
      <FormActions>
        <Button variant="ghost">Cancelar</Button>
        <Button>Publicar</Button>
      </FormActions>,
    );
    const labels = [...el.querySelectorAll('button')].map((b) => b.textContent);
    expect(labels).toEqual(['Cancelar', 'Publicar']);
    expect(el.querySelector('.rds-form-actions__helper')).toBeNull();
  });

  it('inline and stacked are unchanged: floating card and edge to edge, both actions shown, also at 390', async () => {
    for (const width of [1280, 390]) {
      await page.viewport(width, 800);
      const el = await render(
        <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
          <FormActions helper="Você pode editar depois.">
            <Button variant="ghost">Cancelar</Button>
            <Button>Publicar</Button>
          </FormActions>
          <FormActions layout="stacked" style={{ justifySelf: 'stretch' }}>
            <Button variant="ghost">Cancelar</Button>
            <Button>Publicar</Button>
          </FormActions>
        </div>,
      );
      const [inline, stacked] = [...el.querySelectorAll<HTMLElement>('.rds-form-actions')];
      expect(getComputedStyle(inline).borderTopLeftRadius).not.toBe('0px');
      expect(getComputedStyle(stacked).flexDirection).toBe('column');
      expect(shown(inline)).toHaveLength(2);
      expect(shown(stacked)).toHaveLength(2);
      expect(inline.querySelector('[role="status"]')!.textContent).toBe('Você pode editar depois.');
      expect(inline.querySelector('.rds-form-actions__details')).toBeNull();
    }
  });

  it('bar expanded at 1280: one band 68 tall, neutral, hairline on top, helper as text, Cancelar then the primary', async () => {
    await page.viewport(1280, 800);
    const el = await render(<Bar onDetails={() => {}} />);
    const bar = el.querySelector<HTMLElement>('.rds-form-actions--bar')!;
    const style = getComputedStyle(bar);
    expect(bar.getBoundingClientRect().height).toBe(68);
    expect(style.paddingLeft).toBe('24px');
    expect(style.paddingRight).toBe('24px');
    const probe = document.createElement('div');
    probe.style.background = 'var(--surface-page)';
    document.body.appendChild(probe);
    expect(style.backgroundColor).toBe(getComputedStyle(probe).backgroundColor);
    probe.remove();
    expect(style.boxShadow).toContain('inset');
    const actions = shown(bar);
    expect(actions.map((b) => b.textContent)).toEqual(['Cancelar', 'Criar produto']);
    const [cancel, primary] = actions.map((b) => b.getBoundingClientRect());
    expect(cancel.top).toBe(primary.top);
    expect(cancel.right).toBeLessThan(primary.left);
    expect(primary.right).toBe(bar.getBoundingClientRect().right - 24);
    // Expanded the helper stays text: the details button is not shown.
    const details = bar.querySelector<HTMLElement>('.rds-form-actions__details')!;
    expect(getComputedStyle(details).display).toBe('none');
    expect(bar.querySelector('[role="status"]')!.textContent).toContain(HELPER);
  });

  it('bar compact at 390: one row 64 tall, only the primary, the helper (role=status) on the left', async () => {
    await page.viewport(390, 800);
    const el = await render(<Bar />);
    const bar = el.querySelector<HTMLElement>('.rds-form-actions--bar')!;
    expect(bar.getBoundingClientRect().height).toBe(64);
    const actions = shown(bar);
    expect(actions.map((b) => b.textContent)).toEqual(['Criar produto']);
    const status = bar.querySelector<HTMLElement>('[role="status"]')!;
    expect(status.tagName).toBe('P');
    expect(status.textContent).toBe(HELPER);
    const primary = actions[0].getBoundingClientRect();
    const helper = status.getBoundingClientRect();
    expect(primary.height).toBe(44);
    expect(helper.right).toBeLessThanOrEqual(primary.left);
    expect(Math.abs(helper.top + helper.height / 2 - (primary.top + primary.height / 2))).toBeLessThanOrEqual(1);
  });

  it('bar compact: a long helper is clamped to 2 lines and keeps one row beside the primary', async () => {
    await page.viewport(390, 800);
    const el = await render(
      <FormActions layout="bar" helper="Falta preço, prazo, foto de capa, descrição, categoria e estoque mínimo do produto">
        <Button variant="ghost">Cancelar</Button>
        <Button>Criar produto</Button>
      </FormActions>,
    );
    const text = el.querySelector<HTMLElement>('.rds-form-actions__text')!;
    expect(text.getBoundingClientRect().height).toBeLessThanOrEqual(2 * parseFloat(getComputedStyle(text).lineHeight) + 0.5);
    const bar = el.querySelector<HTMLElement>('.rds-form-actions--bar')!;
    const [primary] = shown(bar);
    expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(primary.getBoundingClientRect().left);
    expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
  });

  it('bar compact with onDetails: the helper is a button named by its text and Ver o que falta, aria-expanded, aria-controls, 44 target', async () => {
    await page.viewport(390, 800);
    const onDetails = vi.fn();
    const el = await render(<Bar helper={SHORT} onDetails={onDetails} />);
    const bar = el.querySelector<HTMLElement>('.rds-form-actions--bar')!;
    expect(bar.getBoundingClientRect().height).toBe(64);
    const button = bar.querySelector<HTMLButtonElement>('.rds-form-actions__details')!;
    expect(getComputedStyle(button).display).toBe('flex');
    // The plain-text rendering is out (display: none), so the status is said once.
    expect(getComputedStyle(bar.querySelector('.rds-form-actions__helper > .rds-form-actions__text')!).display).toBe('none');
    const name = button.textContent!;
    expect(name.startsWith(SHORT)).toBe(true);
    expect(name).toBe(`${SHORT}, Ver o que falta`);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe('o-que-falta');
    expect(button.closest('[role="status"]')).not.toBeNull();
    expect(parseFloat(getComputedStyle(button, '::after').minHeight)).toBe(44);
    expect(button.querySelector('svg')).not.toBeNull();
    button.click();
    expect(onDetails).toHaveBeenCalledOnce();
    expect(shown(bar).map((b) => b.textContent)).toEqual(['Criar produto']);

    const open = await render(<Bar onDetails={() => {}} detailsExpanded />);
    expect(open.querySelector('.rds-form-actions__details')!.getAttribute('aria-expanded')).toBe('true');
  });

  // What is on screen as the helper, and what the status says (its rendered, accessible content).
  const visible = (el: Element) =>
    [...el.querySelectorAll<HTMLElement>('.rds-form-actions__helper > *')]
      .filter((n) => getComputedStyle(n).display !== 'none' && !n.classList.contains('rds-visually-hidden'))
      .map((n) => (n.tagName === 'BUTTON' ? 'button' : 'text'));
  const said = (el: Element) => {
    const status = el.querySelector<HTMLElement>('[role="status"]');
    if (!status) return null;
    const out = [...status.children].filter((n) => getComputedStyle(n).display !== 'none');
    return out.map((n) => (n.tagName === 'BUTTON' ? n.querySelector('.rds-form-actions__text')!.textContent : n.textContent));
  };

  it.each([
    // showHelper, onDetails, width → what shows beside the actions, the actions, what the status holds
    [true, false, 1280, ['text'], ['Cancelar', 'Criar produto'], [HELPER]],
    [true, false, 390, ['text'], ['Criar produto'], [HELPER]],
    [true, true, 1280, ['text'], ['Cancelar', 'Criar produto'], [HELPER]],
    [true, true, 390, ['button'], ['Criar produto'], [HELPER]],
    [false, false, 1280, [], ['Cancelar', 'Criar produto'], null],
    [false, false, 390, [], ['Criar produto'], null],
    [false, true, 1280, [], ['Cancelar', 'Criar produto'], [HELPER]],
    [false, true, 390, ['button'], ['Criar produto'], [HELPER]],
  ] as const)('bar showHelper=%s onDetails=%s at %i: helper %j, actions %j, status says %j once', async (showHelper, details, width, helper, actions, status) => {
    await page.viewport(width, 800);
    // Edge to edge, as at the foot of the screen (the test host has 16 of padding).
    const el = await render(
      <div style={{ margin: '0 -16px' }}>
        <Bar showHelper={showHelper} onDetails={details ? () => {} : undefined} />
      </div>,
    );
    const bar = el.querySelector<HTMLElement>('.rds-form-actions--bar')!;
    expect(bar.getBoundingClientRect().width).toBe(width);
    expect(visible(bar)).toEqual(helper);
    expect(shown(bar).map((b) => b.textContent)).toEqual(actions);
    expect(said(bar)).toEqual(status);
    expect(bar.getBoundingClientRect().height).toBe(width === 1280 ? 68 : 64);
    expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
  });

  it('the create form foot (showHelper off, onDetails): 1280 no sentence, 390 the button with chevron; the status says a change once', async () => {
    await page.viewport(1280, 800);
    const onDetails = vi.fn();
    const el = await render(<Bar showHelper={false} onDetails={onDetails} />);
    const bar = el.querySelector<HTMLElement>('.rds-form-actions--bar')!;
    const status = bar.querySelector<HTMLElement>('[role="status"]')!;
    // Expanded: nothing on screen, the hidden copy holds the status.
    const quiet = status.querySelector<HTMLElement>('.rds-form-actions__quiet')!;
    expect(getComputedStyle(quiet).display).not.toBe('none');
    expect(quiet.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(status.querySelector('.rds-form-actions__helper > .rds-form-actions__text')).toBeNull();
    expect(getComputedStyle(bar.querySelector('.rds-form-actions__details')!).display).toBe('none');
    // Compact: the button, named by the helper and Ver o que falta, with the chevron; the copy steps aside.
    await page.viewport(390, 800);
    const button = bar.querySelector<HTMLButtonElement>('.rds-form-actions__details')!;
    expect(getComputedStyle(button).display).toBe('flex');
    expect(getComputedStyle(quiet).display).toBe('none');
    expect(button.textContent).toBe(`${HELPER}, Ver o que falta`);
    expect(button.querySelector('svg')).not.toBeNull();
    expect(button.getBoundingClientRect().width).toBeGreaterThan(0);
    button.click();
    expect(onDetails).toHaveBeenCalledOnce();
    // A new text reaches every rendering at once, inside the one status.
    const next = await render(<Bar showHelper={false} onDetails={() => {}} helper={SHORT} />);
    expect(said(next)).toEqual([SHORT]);
    await page.viewport(1280, 800);
    expect(said(next)).toEqual([SHORT]);
    expect(next.querySelectorAll('[role="status"]')).toHaveLength(1);
  });

  it('showHelper={false} without details leaves the helper out, in inline and stacked too', async () => {
    const el = await render(
      <div>
        <FormActions helper={HELPER} showHelper={false}>
          <Button>Criar</Button>
        </FormActions>
        <FormActions layout="stacked" helper={HELPER} showHelper={false}>
          <Button>Criar</Button>
        </FormActions>
        <FormActions layout="bar" helper={HELPER} showHelper={false}>
          <Button>Criar</Button>
        </FormActions>
      </div>,
    );
    expect(el.querySelector('.rds-form-actions__helper')).toBeNull();
    expect(el.textContent).not.toContain(HELPER);
  });

  it('detailsLabel renames the hidden part of the name; details only in bar', async () => {
    await page.viewport(390, 800);
    const el = await render(
      <FormActions layout="bar" helper={HELPER} onDetails={() => {}} detailsLabel="Abrir lista">
        <Button>Criar</Button>
      </FormActions>,
    );
    expect(el.querySelector('.rds-form-actions__details')!.textContent).toBe(`${HELPER}, Abrir lista`);
    const inline = await render(
      <FormActions helper={HELPER} onDetails={() => {}}>
        <Button>Criar</Button>
      </FormActions>,
    );
    expect(inline.querySelector('.rds-form-actions__details')).toBeNull();
  });

  it('a light brand (cyan #00aeef from generateRdsTheme): bar passes axe, expanded and compact, light and dark', async () => {
    const theme = generateRdsTheme({ name: 'ciano', brand: { primary: '#00aeef' }, fonts: { body: 'inter' } } as BrandDef);
    brandStyle = document.createElement('style');
    brandStyle.textContent = emitRdsCss(theme);
    document.head.appendChild(brandStyle);
    for (const mode of MODES) {
      for (const width of [1280, 390]) {
        await page.viewport(width, 800);
        const el = await render(
          <div style={{ display: 'grid', gap: 8 }}>
            <Bar onDetails={() => {}} />
            <FormActions helper="Você pode editar depois.">
              <Button tone="neutral" variant="ghost">Cancelar</Button>
              <Button tone="action">Publicar</Button>
            </FormActions>
          </div>,
          mode,
        );
        expect(await axeViolations(el)).toEqual([]);
        // The pointer over each filled action button, as it sits in CI: the hover fill keeps the label at AA
        // (it was #005679 under a black label, 2.6:1).
        for (const name of ['Criar produto', 'Publicar']) {
          const button = [...el.querySelectorAll('button')].find((b) => b.textContent === name)!;
          await userEvent.hover(button);
          expect(await axeViolations(el), `${mode} ${width} hover ${name}`).toEqual([]);
        }
        await userEvent.unhover(el);
      }
    }
  });
});
