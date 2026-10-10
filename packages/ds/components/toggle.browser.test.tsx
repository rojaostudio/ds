import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { cdp, userEvent } from 'vitest/browser';
import { Toggle, type ToggleVariant } from './toggle';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const VARIANTS: ToggleVariant[] = ['ghost', 'outline'];
const Bold = () => (
  <svg viewBox="0 0 24 24">
    <path d="M6 4h8a4 4 0 0 1 0 8H6z" />
  </svg>
);

// The [RDS] paints "on" with toggle/label/pressed → text/selected (colors/primary/default) over toggle/background/pressed →
// surface/tint/subtle (#26; surface/tint/default before). In dark, subtle is the default tint itself (no step
// below 900). It failed (3.4:1) on the orange tint #b34b00 the generator drew; the rojao theme is the Figma table
// now, with subtle at blue/900 in dark, and "on" passes in both modes.

describe.each(MODES)('Toggle (%s)', (mode) => {
  it('every variant, off and on, enabled and disabled, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8 }}>
        {VARIANTS.map((variant) => (
          <div key={variant} style={{ display: 'flex', gap: 8 }}>
            <Toggle variant={variant}>Negrito</Toggle>
            <Toggle variant={variant} defaultPressed>Negrito</Toggle>
            <Toggle variant={variant} icon={<Bold />} aria-label="Negrito" />
            <Toggle variant={variant} icon={<Bold />} defaultPressed>Negrito</Toggle>
            <Toggle variant={variant} disabled>Negrito</Toggle>
            <Toggle variant={variant} disabled defaultPressed>Negrito</Toggle>
          </div>
        ))}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('is 44px tall (the touch minimum)', async () => {
    const el = await render(<Toggle variant="outline">Negrito</Toggle>, mode);
    expect(el.querySelector('button')!.getBoundingClientRect().height).toBe(44);
  });

  // #26: outline "on" draws its border in border-width-strong (2px); the padding gives the extra pixel back, so
  // the toggle keeps its size. Off, and on the ghost, the border stays 1px.
  it('outline on: a 2px border without changing the size, off and ghost stay 1px', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Toggle variant="outline">Negrito</Toggle>
        <Toggle variant="outline" defaultPressed>Negrito</Toggle>
        <Toggle variant="outline" disabled defaultPressed>Negrito</Toggle>
        <Toggle variant="ghost" defaultPressed>Negrito</Toggle>
        <Toggle variant="outline" icon={<Bold />} aria-label="Negrito" />
        <Toggle variant="outline" icon={<Bold />} aria-label="Negrito" defaultPressed />
      </div>,
      mode,
    );
    const [off, on, onDisabled, ghostOn, iconOff, iconOn] = Array.from(el.querySelectorAll('button'));
    const border = (b: HTMLElement) => getComputedStyle(b).borderTopWidth;
    expect(border(off)).toBe('1px');
    expect(border(on)).toBe('2px');
    expect(border(onDisabled)).toBe('2px');
    expect(border(ghostOn)).toBe('1px');
    expect(border(iconOn)).toBe('2px');
    expect(getComputedStyle(on).borderTopColor).toBe(getComputedStyle(on).color);
    for (const b of [off, on, onDisabled, ghostOn, iconOff, iconOn]) expect(b.getBoundingClientRect().height).toBe(44);
    expect(on.getBoundingClientRect().width).toBe(off.getBoundingClientRect().width);
    expect(iconOn.getBoundingClientRect().width).toBe(44);
    // The content does not move when it turns on: the label sits at the same offset inside the box.
    const inner = (b: HTMLElement) => {
      const r = document.createRange();
      r.selectNodeContents(b);
      return r.getBoundingClientRect().left - b.getBoundingClientRect().left;
    };
    expect(inner(on)).toBe(inner(off));
  });
});

describe('Toggle behaviour', () => {
  it('pressed on the rojao dark theme passes axe (primary label on the blue tint of the Figma)', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 8 }}>
        <Toggle variant="ghost" defaultPressed>Negrito</Toggle>
        <Toggle variant="outline" defaultPressed>Negrito</Toggle>
      </div>,
      'dark',
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('turns on and off with click and with the keyboard, reporting aria-pressed', async () => {
    const onPressedChange = vi.fn();
    const el = await render(<Toggle onPressedChange={onPressedChange}>Negrito</Toggle>);
    const b = el.querySelector('button')!;
    expect(b.getAttribute('aria-pressed')).toBe('false');
    await act(async () => b.click());
    expect(b.getAttribute('aria-pressed')).toBe('true');
    expect(b.getAttribute('data-state')).toBe('on');
    expect(onPressedChange).toHaveBeenLastCalledWith(true);
    b.focus();
    await userEvent.keyboard(' ');
    expect(b.getAttribute('aria-pressed')).toBe('false');
    await userEvent.keyboard('{Enter}');
    expect(b.getAttribute('aria-pressed')).toBe('true');
  });

  it('disabled stays focusable and does not toggle', async () => {
    const onPressedChange = vi.fn();
    const el = await render(
      <Toggle disabled onPressedChange={onPressedChange}>
        Negrito
      </Toggle>,
    );
    const b = el.querySelector('button')!;
    b.focus();
    expect(document.activeElement).toBe(b);
    expect(b.getAttribute('aria-disabled')).toBe('true');
    await act(async () => b.click());
    await userEvent.keyboard(' ');
    expect(b.getAttribute('aria-pressed')).toBe('false');
    expect(onPressedChange).not.toHaveBeenCalled();
  });
});

describe('Toggle size', () => {
  const touch = (enabled: boolean) => cdp().send('Emulation.setTouchEmulationEnabled', { enabled, maxTouchPoints: 1 });
  afterEach(async () => {
    await touch(false);
  });

  const layout = (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, padding: 24 }}>
      <Toggle size="sm" variant="outline" icon={<Bold />}>
        Negrito
      </Toggle>
      <Toggle size="sm" variant="outline" icon={<Bold />} aria-label="Negrito" />
      <Toggle size="sm" variant="outline" icon={<Bold />} aria-label="Negrito" defaultPressed />
      <Toggle variant="outline">Negrito</Toggle>
    </div>
  );

  it('sm is 32 tall with a 16 icon; only the icon makes a 32 square, also outline on; md stays 44', async () => {
    const el = await render(layout);
    const [text, icon, iconOn, md] = Array.from(el.querySelectorAll('button'));
    expect(text!.getBoundingClientRect().height).toBe(32);
    const glyph = text!.querySelector('.rds-toggle__icon')!.getBoundingClientRect();
    expect([glyph.width, glyph.height]).toEqual([16, 16]);
    for (const b of [icon!, iconOn!]) {
      const r = b.getBoundingClientRect();
      expect([r.width, r.height]).toEqual([32, 32]);
    }
    expect(md!.getBoundingClientRect().height).toBe(44);
  });

  it.each(MODES)('sm passes axe (%s)', async (mode) => {
    const el = await render(layout, mode);
    expect(await axeViolations(el)).toEqual([]);
  });

  it('with a fine pointer, sm takes only its own 32', async () => {
    const el = await render(layout);
    expect(matchMedia('(pointer: coarse)').matches).toBe(false);
    const [text, icon] = Array.from(el.querySelectorAll('button'));
    const r = text!.getBoundingClientRect();
    expect(document.elementFromPoint(r.left + r.width / 2, r.top - 2)).not.toBe(text);
    const i = icon!.getBoundingClientRect();
    expect(document.elementFromPoint(i.left - 2, i.top + i.height / 2)).not.toBe(icon);
  });

  it('with a coarse pointer, sm takes the touch to 44 (vertically; four sides with only the icon), the layout unmoved', async () => {
    await touch(true);
    const el = await render(layout);
    expect(matchMedia('(pointer: coarse)').matches).toBe(true);
    const [text, icon, iconOn, md] = Array.from(el.querySelectorAll('button'));
    const r = text!.getBoundingClientRect();
    expect(r.height).toBe(32);
    const x = r.left + r.width / 2;
    expect(document.elementFromPoint(x, r.top - 5.5)).toBe(text);
    expect(document.elementFromPoint(x, r.bottom + 5.5)).toBe(text);
    expect(document.elementFromPoint(x, r.top - 7)).not.toBe(text);
    expect(document.elementFromPoint(r.left - 2, r.top + r.height / 2)).not.toBe(text);
    // Only the icon (off with a 1px border, on with 2px): 44 x 44 either way.
    for (const b of [icon!, iconOn!]) {
      const i = b.getBoundingClientRect();
      expect([i.width, i.height]).toEqual([32, 32]);
      const y = i.top + i.height / 2;
      expect(document.elementFromPoint(i.left - 5.5, y)).toBe(b);
      expect(document.elementFromPoint(i.right + 5.5, y)).toBe(b);
      expect(document.elementFromPoint(i.left + i.width / 2, i.top - 5.5)).toBe(b);
      expect(document.elementFromPoint(i.left + i.width / 2, i.bottom + 5.5)).toBe(b);
      expect(document.elementFromPoint(i.left - 7, y)).not.toBe(b);
    }
    expect(getComputedStyle(md!, '::after').content).toBe('none');
    const after = getComputedStyle(text!, '::after');
    expect(after.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(after.borderTopStyle).toBe('none');
    expect(await axeViolations(el)).toEqual([]);
  });
});
