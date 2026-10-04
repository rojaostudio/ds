import { useState } from 'react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Button } from './button';
import { LoadingOverlay } from './loading-overlay';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

const LABEL = 'Criando o produto…';
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const overlay = () => document.querySelector<HTMLElement>('.rds-loading-overlay');
const r0 = (e: Element) => e.getBoundingClientRect();
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');

/** A screen as the docs wire it: the main button in loading, the overlay after the delay, an error that closes it. */
function Screen({ delay = 400 }: { delay?: number }) {
  const [running, setRunning] = useState(false);
  return (
    <>
      <Button loading={running} loadingLabel="Criando…" onClick={() => setRunning(true)}>
        Criar produto
      </Button>
      <button type="button" onClick={() => setRunning(false)}>
        falhar
      </button>
      <LoadingOverlay open={running} label={LABEL} delay={delay} />
    </>
  );
}

describe('LoadingOverlay time', () => {
  it('does not show before the delay, shows after it', async () => {
    await render(<LoadingOverlay open label={LABEL} delay={400} />);
    await wait(150);
    expect(overlay()).toBeNull();
    await vi.waitFor(() => expect(overlay()).not.toBeNull(), { timeout: 1500 });
  });

  it('never shows if open goes back to false before the delay (the page opened first)', async () => {
    const el = await render(<Screen delay={300} />);
    const [create, fail] = el.querySelectorAll('button');
    await userEvent.click(create);
    await wait(100);
    await userEvent.click(fail);
    await wait(400);
    expect(overlay()).toBeNull();
  });

  it('delay 0 shows at once', async () => {
    await render(<LoadingOverlay open label={LABEL} delay={0} />);
    await vi.waitFor(() => expect(overlay()).not.toBeNull());
  });
});

describe('LoadingOverlay behaviour', () => {
  it('a modal dialog named by the label, in a portal on the body, fixed over the screen in the overlay layer', async () => {
    const el = await render(<LoadingOverlay open label={LABEL} delay={0} />);
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    const veil = overlay()!;
    expect(veil.parentElement).toBe(document.body);
    expect(el.contains(veil)).toBe(false);
    const style = getComputedStyle(veil);
    expect(style.position).toBe('fixed');
    expect([style.top, style.right, style.bottom, style.left]).toEqual(['0px', '0px', '0px', '0px']);
    expect(style.zIndex).toBe(getComputedStyle(document.documentElement).getPropertyValue('--z-overlay').trim());
    const box = dialog()!;
    expect(box.getAttribute('aria-modal')).toBe('true');
    expect(box.getAttribute('aria-label')).toBe(LABEL);
    expect(box.querySelectorAll('button')).toHaveLength(0);
    // The panel: centred, radius/container, 24 padding, 16 gap, at most 320.
    const panel = getComputedStyle(box);
    expect(panel.borderRadius).toBe('12px');
    expect(panel.padding).toBe('24px');
    expect(panel.rowGap).toBe('16px');
    expect(panel.maxWidth).toBe('min(320px, 100%)');
    expect(r0(box).width).toBeLessThanOrEqual(320);
    const r = box.getBoundingClientRect();
    expect(Math.abs(r.left + r.width / 2 - innerWidth / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(r.top + r.height / 2 - innerHeight / 2)).toBeLessThanOrEqual(1);
    // The Spinner lg (32), the picture only.
    const spinner = box.querySelector<HTMLElement>('.rds-spinner')!;
    expect(spinner.classList.contains('rds-spinner--lg')).toBe(true);
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
    expect(spinner.querySelector('svg')!.getBoundingClientRect().width).toBe(32);
  });

  it('the label is said once, in an aria-live="polite" region', async () => {
    await render(<LoadingOverlay open label={LABEL} delay={0} />);
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    const live = dialog()!.querySelectorAll('[aria-live]');
    expect(live).toHaveLength(1);
    expect(live[0].tagName).toBe('P');
    expect(live[0].getAttribute('aria-live')).toBe('polite');
    expect(live[0].textContent).toBe(LABEL);
    expect(dialog()!.querySelectorAll('[role="status"]:not([aria-hidden="true"])')).toHaveLength(0);
  });

  it('the label defaults to Carregando…', async () => {
    await render(<LoadingOverlay open delay={0} />);
    await vi.waitFor(() => expect(dialog()?.getAttribute('aria-label')).toBe('Carregando…'));
  });

  it('focus goes to the panel and stays there: Tab and a focus elsewhere come back; Escape does not close', async () => {
    const el = await render(<Screen delay={0} />);
    const [create, fail] = el.querySelectorAll<HTMLElement>('button');
    create.focus();
    await userEvent.click(create);
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    expect(document.activeElement).toBe(dialog());
    expect(dialog()!.tabIndex).toBe(-1);
    await userEvent.tab();
    expect(document.activeElement).toBe(dialog());
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(dialog());
    fail.focus();
    expect(document.activeElement).toBe(dialog());
    await userEvent.keyboard('{Escape}');
    await wait(50);
    expect(dialog()).not.toBeNull();
    expect(document.activeElement).toBe(dialog());
  });

  it('the rest of the page is inert and aria-busy while shown, and put back on close; the focus goes back to the button (the error flow)', async () => {
    const el = await render(<Screen delay={0} />);
    const keepInert = document.createElement('div');
    keepInert.setAttribute('inert', '');
    keepInert.setAttribute('aria-busy', 'false');
    document.body.appendChild(keepInert);
    const [create, fail] = el.querySelectorAll<HTMLElement>('button');
    create.focus();
    await userEvent.click(create);
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    expect(el.hasAttribute('inert')).toBe(true);
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(overlay()!.hasAttribute('inert')).toBe(false);
    expect(overlay()!.hasAttribute('aria-busy')).toBe(false);
    // The app sets open={false} (the error goes back to the SavingBar): the overlay leaves.
    act(() => fail.click());
    await vi.waitFor(() => expect(overlay()).toBeNull());
    expect(el.hasAttribute('inert')).toBe(false);
    expect(el.hasAttribute('aria-busy')).toBe(false);
    // An element that was inert before is left as it was.
    expect(keepInert.hasAttribute('inert')).toBe(true);
    expect(keepInert.getAttribute('aria-busy')).toBe('false');
    expect(document.activeElement).toBe(create);
    keepInert.remove();
  });

  it('with container, the portal goes there and only the rest around it is inert', async () => {
    const el = await render(
      <div>
        <p id="antes">antes</p>
        <div id="alvo" />
      </div>,
    );
    const target = el.querySelector<HTMLElement>('#alvo')!;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(host);
    await act(async () => root.render(<LoadingOverlay open delay={0} label={LABEL} container={target} />));
    await vi.waitFor(() => expect(target.querySelector('.rds-loading-overlay')).not.toBeNull());
    expect(el.querySelector('#antes')!.hasAttribute('inert')).toBe(true);
    expect(target.hasAttribute('inert')).toBe(false);
    act(() => root.unmount());
    host.remove();
    expect(el.querySelector('#antes')!.hasAttribute('inert')).toBe(false);
  });

  it('prefers-reduced-motion: no fade, and the Spinner turns slowly (3 s a turn)', async () => {
    await render(<LoadingOverlay open delay={0} />);
    await vi.waitFor(() => expect(overlay()).not.toBeNull());
    expect(getComputedStyle(overlay()!).animationName).toBe('rds-loading-overlay-in');
    const reduced = [...document.styleSheets]
      .flatMap((sheet) => {
        try {
          return [...sheet.cssRules];
        } catch {
          return [];
        }
      })
      .flatMap(function flat(rule): CSSRule[] {
        return 'cssRules' in rule ? [rule, ...[...(rule as CSSGroupingRule).cssRules].flatMap(flat)] : [rule];
      })
      .filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule && rule.conditionText.includes('prefers-reduced-motion'))
      .map((rule) => rule.cssText)
      .join(' ');
    expect(reduced).toMatch(/\.rds-loading-overlay \{ animation: [^;]*none[^;]*; \}/);
    expect(reduced).toMatch(/\.rds-spinner__ring \{ animation-duration: 3s; \}/);
  });
});

describe('LoadingOverlay axe', () => {
  it.each(MODES)('passes axe (%s)', async (mode) => {
    await page.viewport(390, 844);
    await render(<p>Novo produto</p>, mode);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(host);
    await act(async () => root.render(<LoadingOverlay open delay={0} label={LABEL} />));
    await vi.waitFor(() => expect(overlay()).not.toBeNull());
    await settle();
    expect(await axeViolations(overlay()!)).toEqual([]);
    act(() => root.unmount());
    host.remove();
  });

  it('passes axe in the brand (inside a .ds-plate, via container)', async () => {
    await page.viewport(1280, 800);
    for (const mode of MODES) {
      const el = await render(<div className="ds-plate" style={{ background: 'var(--surface-page)', minHeight: 200 }} />, mode);
      const plate = el.querySelector<HTMLElement>('.ds-plate')!;
      const host = document.createElement('div');
      document.body.appendChild(host);
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(host);
      await act(async () => root.render(<LoadingOverlay open delay={0} label={LABEL} container={plate} />));
      await vi.waitFor(() => expect(plate.querySelector('.rds-loading-overlay')).not.toBeNull());
      await settle();
      const panel = plate.querySelector<HTMLElement>('.rds-loading-overlay__panel')!;
      // The panel reads surface/card and the text text/body as the plate resolves them.
      const plateStyle = getComputedStyle(plate);
      const probe = document.createElement('span');
      probe.style.background = plateStyle.getPropertyValue('--surface-card');
      probe.style.color = plateStyle.getPropertyValue('--text-body');
      plate.appendChild(probe);
      expect(getComputedStyle(panel).backgroundColor).toBe(getComputedStyle(probe).backgroundColor);
      expect(getComputedStyle(panel).color).toBe(getComputedStyle(probe).color);
      probe.remove();
      expect(await axeViolations(plate.querySelector('.rds-loading-overlay')!)).toEqual([]);
      act(() => root.unmount());
      host.remove();
      cleanup();
    }
  });
});
