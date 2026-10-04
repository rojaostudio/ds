import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { page, userEvent } from 'vitest/browser';
import { Button } from '../button';
import { FormActions, type FormActionsPlacement } from '../form-actions';
import { SavingBar } from '../saving-bar';
import { Toaster, toast } from '../toast';
import { cleanup, render } from '../__tests__/render';

/*
 * The phone's on-screen keyboard, simulated: the visual viewport shrinks (visualViewport.height, stubbed on the
 * instance) and fires resize, as Safari and Chrome do when the keyboard comes up over a focused field.
 */
const viewport = window.visualViewport!;

async function keyboard(height: number | null) {
  if (height === null) delete (viewport as unknown as Record<string, unknown>).height;
  else Object.defineProperty(viewport, 'height', { configurable: true, get: () => height });
  await act(async () => {
    viewport.dispatchEvent(new Event('resize'));
    await frame();
  });
}

const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

/** The hook measures one frame after the event: let it, and let the slide finish. */
async function settled(el: Element) {
  await act(async () => {
    await frame();
    await frame();
  });
  await Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined)));
}

afterEach(async () => {
  await keyboard(null);
  cleanup();
  await page.viewport(1280, 800);
});

function Form({ placement = 'docked', field = 'text' }: { placement?: FormActionsPlacement; field?: string }) {
  return (
    <form>
      <label>
        Nome <input type={field} />
      </label>
      <FormActions placement={placement}>
        <Button tone="neutral" variant="ghost">Cancelar</Button>
        <Button tone="action">Criar produto</Button>
      </FormActions>
    </form>
  );
}

function Edit() {
  return (
    <form>
      <label>
        Nome <input type="text" />
      </label>
      <SavingBar onSave={() => {}} onDiscard={() => {}} />
    </form>
  );
}

const hidden = (bar: HTMLElement) => getComputedStyle(bar).visibility === 'hidden';
/** translateY of the computed transform, in px (0 without one). */
const shift = (bar: HTMLElement) => new DOMMatrix(getComputedStyle(bar).transform === 'none' ? '' : getComputedStyle(bar).transform).f;

describe.each([
  ['FormActions docked', () => <Form />, '.rds-form-actions', 'rds-bottom-bar--keyboard'],
  ['FormActions floating', () => <Form placement="floating" />, '.rds-form-actions', 'rds-bottom-bar--keyboard'],
  ['SavingBar', () => <Edit />, '.rds-savingbar', 'rds-bottom-bar--keyboard'],
] as const)('%s and the on-screen keyboard', (_, ui, selector, keyboardClass) => {
  it('at 390, a field focused and the visible area shrunk: the bar slides down and hides, the focus stays in the field', async () => {
    await page.viewport(390, 800);
    const el = await render(ui());
    const bar = el.querySelector<HTMLElement>(selector)!;
    const input = el.querySelector('input')!;
    await userEvent.click(input);
    await keyboard(420);
    await settled(bar);
    expect(bar.classList.contains(keyboardClass)).toBe(true);
    expect(hidden(bar)).toBe(true);
    expect(shift(bar)).toBeCloseTo(bar.offsetHeight, 0);
    expect(document.activeElement).toBe(input);
  });

  it('comes back when the keyboard closes (the visible area grows back), the field still focused', async () => {
    await page.viewport(390, 800);
    const el = await render(ui());
    const bar = el.querySelector<HTMLElement>(selector)!;
    const input = el.querySelector('input')!;
    await userEvent.click(input);
    await keyboard(420);
    await settled(bar);
    expect(hidden(bar)).toBe(true);
    await keyboard(800);
    await settled(bar);
    expect(bar.classList.contains(keyboardClass)).toBe(false);
    expect(hidden(bar)).toBe(false);
    expect(shift(bar)).toBe(0);
    expect(document.activeElement).toBe(input);
  });

  it('comes back on blur, before the viewport settles', async () => {
    await page.viewport(390, 800);
    const el = await render(ui());
    const bar = el.querySelector<HTMLElement>(selector)!;
    const input = el.querySelector('input')!;
    await userEvent.click(input);
    await keyboard(420);
    await settled(bar);
    expect(hidden(bar)).toBe(true);
    await act(async () => input.blur());
    await settled(bar);
    expect(bar.classList.contains(keyboardClass)).toBe(false);
    expect(hidden(bar)).toBe(false);
  });

  it('a shrunk viewport without a focused field (the browser bars, a pinch) does not hide it', async () => {
    await page.viewport(390, 800);
    const el = await render(ui());
    const bar = el.querySelector<HTMLElement>(selector)!;
    await keyboard(420);
    await settled(bar);
    expect(hidden(bar)).toBe(false);
  });

  it('a small change of the visible area (the browser bars) with a field focused does not hide it', async () => {
    await page.viewport(390, 800);
    const el = await render(ui());
    const bar = el.querySelector<HTMLElement>(selector)!;
    await userEvent.click(el.querySelector('input')!);
    await keyboard(720);
    await settled(bar);
    expect(hidden(bar)).toBe(false);
  });

  it('at 1280 (expanded) it stays, keyboard or not', async () => {
    await page.viewport(1280, 800);
    const el = await render(ui());
    const bar = el.querySelector<HTMLElement>(selector)!;
    await userEvent.click(el.querySelector('input')!);
    await keyboard(420);
    await settled(bar);
    expect(bar.classList.contains(keyboardClass)).toBe(false);
    expect(hidden(bar)).toBe(false);
  });
});

describe('the bars and the on-screen keyboard: what does not count', () => {
  it('a checkbox focused brings up no keyboard: the bar stays', async () => {
    await page.viewport(390, 800);
    const el = await render(<Form field="checkbox" />);
    const bar = el.querySelector<HTMLElement>('.rds-form-actions')!;
    await userEvent.click(el.querySelector('input')!);
    await keyboard(420);
    await settled(bar);
    expect(hidden(bar)).toBe(false);
  });
});

describe('the slide respects prefers-reduced-motion', () => {
  /** The rules that set a transition on these selectors, with the media conditions around each. */
  function transitions(selector: RegExp) {
    const found: string[][] = [];
    const walk = (rules: CSSRuleList, media: string[]) => {
      for (const rule of rules) {
        if (rule instanceof CSSMediaRule) walk(rule.cssRules, [...media, rule.conditionText]);
        else if (rule instanceof CSSLayerBlockRule) walk(rule.cssRules, media);
        else if (rule instanceof CSSImportRule && rule.styleSheet) walk(rule.styleSheet.cssRules, media);
        else if (rule instanceof CSSStyleRule && selector.test(rule.selectorText) && rule.style.transition) found.push(media);
      }
    };
    for (const sheet of document.styleSheets) walk(sheet.cssRules, []);
    return found;
  }

  it.each([
    ['the shell (FormActions and SavingBar)', /^\.rds-bottom-bar(--keyboard)?$/],
  ])('%s: the transitions live only under no-preference, in compact', (_, selector) => {
    const found = transitions(selector);
    expect(found.length).toBeGreaterThan(0);
    for (const media of found) expect(media.join(' and ')).toMatch(/max-width: 1023px\)? and \(prefers-reduced-motion: no-preference/);
  });
});

describe('the Toaster while the keyboard hides the bar', () => {
  it('at 390 the stack sits above the bar (its height + 16), drops to 16 while the keyboard is open, and rises again when it closes', async () => {
    await page.viewport(390, 800);
    const el = await render(
      <Toaster>
        <Edit />
      </Toaster>,
    );
    const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
    act(() => {
      toast({ id: 'kb', title: 'Rascunho salvo', duration: 60000 });
    });
    const stack = () => document.querySelector<HTMLElement>('.rds-toast-viewport')!;
    const offset = () => getComputedStyle(stack()).paddingBottom;
    const above = `${bar.getBoundingClientRect().height + 16}px`;
    await vi.waitFor(() => expect(offset()).toBe(above));
    await userEvent.click(el.querySelector('input')!);
    await keyboard(420);
    await settled(bar);
    expect(hidden(bar)).toBe(true);
    await vi.waitFor(() => expect(offset()).toBe('16px'));
    await keyboard(800);
    await settled(bar);
    await vi.waitFor(() => expect(offset()).toBe(above));
    act(() => toast.dismiss());
  });
});
