import { afterEach, describe, expect, it, vi } from 'vitest';
import { cdp } from 'vitest/browser';
import { Button, type ButtonSize, type ButtonTone, type ButtonVariant } from './button';
import { IconButton } from './icon-button';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const TONES: ButtonTone[] = ['action', 'neutral', 'danger'];
const VARIANTS: ButtonVariant[] = ['fill', 'outline', 'ghost'];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];
// Figma [RDS] Actions/Button and IconButton, size: height, text, Button icon, IconButton icon.
const MEASURES: Record<ButtonSize, { height: number; textSize: number; line: number; icon: number; iconOnly: number }> = {
  sm: { height: 32, textSize: 14, line: 20, icon: 16, iconOnly: 16 },
  md: { height: 44, textSize: 14, line: 20, icon: 16, iconOnly: 20 },
  lg: { height: 52, textSize: 16, line: 24, icon: 20, iconOnly: 24 },
};
const Arrow = () => (
  <svg viewBox="0 0 24 24">
    <path d="M5 12h14" />
  </svg>
);

// The plate is a theme mode: the regular tones inside it take the plate's colours. Over the brand colour, the Figma
// asks for the brand mode with tone=neutral (the inverse tone is gone).
const Plate = ({ children }: { children: React.ReactNode }) => (
  <div className="ds-plate" style={{ background: 'var(--surface-page)', padding: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {children}
  </div>
);

describe.each(MODES)('Button (%s)', (mode) => {
  it('every tone × variant × size, icon on both sides, enabled and disabled, Button and IconButton, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8 }}>
        {SIZES.flatMap((size) =>
          TONES.flatMap((tone) =>
            VARIANTS.map((variant) => (
              <div key={`${size}-${tone}-${variant}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Button size={size} tone={tone} variant={variant}>Ver o pedido</Button>
                <Button size={size} tone={tone} variant={variant} icon={<Arrow />}>Ver o pedido</Button>
                <Button size={size} tone={tone} variant={variant} icon={<Arrow />} iconPosition="start">
                  Ver o pedido
                </Button>
                <Button size={size} tone={tone} variant={variant} disabled>Ver o pedido</Button>
                <IconButton size={size} tone={tone} variant={variant} icon={<Arrow />} label="Avançar" />
                <IconButton size={size} tone={tone} variant={variant} icon={<Arrow />} label="Avançar" disabled />
              </div>
            )),
          ),
        )}
        {SIZES.map((size) => (
          <Plate key={size}>
            {VARIANTS.map((variant) => (
              <Button key={variant} size={size} tone="neutral" variant={variant} icon={<Arrow />} iconPosition="start">
                Ver o pedido
              </Button>
            ))}
            {VARIANTS.map((variant) => (
              <IconButton key={`i-${variant}`} size={size} tone="neutral" variant={variant} icon={<Arrow />} label="Avançar" />
            ))}
            <Button size={size} tone="neutral" variant="fill" disabled>Ver o pedido</Button>
          </Plate>
        ))}
        <Plate>
          <Button tone="action" variant="fill">Ver o pedido</Button>
          <Button tone="action" variant="outline">Ver o pedido</Button>
        </Plate>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('is 32, 44 and 52 tall (sm, md, lg) in every variant; the IconButton is a square of the same side', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8 }}>
        {SIZES.map((size) => (
          <div key={size} data-size={size} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            {VARIANTS.map((v) => <Button key={v} size={size} variant={v}>Ok</Button>)}
            {VARIANTS.map((v) => <Button key={`i-${v}`} size={size} variant={v} icon={<Arrow />}>Ok</Button>)}
            {VARIANTS.map((v) => <IconButton key={`o-${v}`} size={size} variant={v} icon={<Arrow />} label="Avançar" />)}
          </div>
        ))}
      </div>,
      mode,
    );
    for (const size of SIZES) {
      const m = MEASURES[size];
      const row = el.querySelector(`[data-size="${size}"]`)!;
      for (const b of row.querySelectorAll('button')) expect(b.getBoundingClientRect().height).toBe(m.height);
      for (const b of row.querySelectorAll('[aria-label="Avançar"]')) {
        expect(b.getBoundingClientRect().width).toBe(m.height);
        expect(b.querySelector('.rds-button__icon')!.getBoundingClientRect().width).toBe(m.iconOnly);
      }
      const text = row.querySelector('button')!;
      expect(getComputedStyle(text).fontSize).toBe(`${m.textSize}px`);
      expect(getComputedStyle(text).lineHeight).toBe(`${m.line}px`);
      const withIcon = [...row.querySelectorAll('button')].find(
        (b) => !b.hasAttribute('aria-label') && b.querySelector('.rds-button__icon'),
      )!;
      expect(withIcon.querySelector('.rds-button__icon')!.getBoundingClientRect().width).toBe(m.icon);
    }
  });

  it('md is the default size', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Button>Ok</Button>
        <IconButton icon={<Arrow />} label="Avançar" />
      </div>,
      mode,
    );
    for (const b of el.querySelectorAll('button')) {
      expect(b.className).toContain('rds-button--md');
      expect(b.getBoundingClientRect().height).toBe(44);
    }
  });
});

const labelRect = (button: Element) => {
  const node = [...button.childNodes].find((n) => n.nodeType === Node.TEXT_NODE)!;
  const range = document.createRange();
  range.selectNodeContents(node);
  return range.getBoundingClientRect();
};

describe('Button iconPosition', () => {
  it('end (default) puts the icon after the text, in the DOM and on screen', async () => {
    const el = await render(<Button icon={<Arrow />}>Salvar</Button>);
    const b = el.querySelector('button')!;
    expect(b.firstChild!.nodeType).toBe(Node.TEXT_NODE);
    expect(b.lastElementChild!.className).toContain('rds-button__icon');
    expect(b.lastElementChild!.getBoundingClientRect().left - labelRect(b).right).toBeCloseTo(8, 0);
  });

  it('start puts the icon before the text, 8px away, without changing the name', async () => {
    const el = await render(<Button icon={<Arrow />} iconPosition="start">Salvar</Button>);
    const b = el.querySelector('button')!;
    expect(b.firstChild).toBe(b.querySelector('.rds-button__icon'));
    expect(b.lastChild!.nodeType).toBe(Node.TEXT_NODE);
    expect(labelRect(b).left - b.firstElementChild!.getBoundingClientRect().right).toBeCloseTo(8, 0);
    expect(b.textContent).toBe('Salvar');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('start with asChild puts the icon first inside the link', async () => {
    const el = await render(
      <Button asChild icon={<Arrow />} iconPosition="start">
        <a href="#pedido">Ver o pedido</a>
      </Button>,
    );
    const a = el.querySelector('a')!;
    expect(a.firstElementChild!.className).toContain('rds-button__icon');
    expect(a.lastChild!.nodeType).toBe(Node.TEXT_NODE);
  });

  it('loading: with the icon at start the loader is at start; without an icon it covers the label', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 8 }}>
        <Button loading icon={<Arrow />} iconPosition="start">Salvar</Button>
        <Button loading iconPosition="start">Enviar</Button>
      </div>,
    );
    const [withIcon, bare] = el.querySelectorAll('button');
    expect(withIcon.firstElementChild!.className).toContain('rds-button__loader');
    expect(withIcon.firstElementChild!.getBoundingClientRect().right).toBeLessThanOrEqual(labelRect(withIcon).left);
    expect(withIcon.className).not.toContain('rds-button--loading');
    expect(bare.className).toContain('rds-button--loading');
    const loader = bare.querySelector('.rds-button__loader')!.getBoundingClientRect();
    const box = bare.getBoundingClientRect();
    expect(loader.left + loader.width / 2).toBeCloseTo(box.left + box.width / 2, 0);
    expect(loader.top + loader.height / 2).toBeCloseTo(box.top + box.height / 2, 0);
  });
});

/**
 * The touch target of sm. Playwright's Chromium is driven over CDP: Emulation.setTouchEmulationEnabled makes the
 * page a touch device, so `(pointer: coarse)` really matches, and the hit test (elementFromPoint) shows where a
 * finger lands.
 */
describe('Button touch target (sm)', () => {
  const touch = (enabled: boolean) =>
    cdp().send('Emulation.setTouchEmulationEnabled', { enabled, maxTouchPoints: 1 });
  afterEach(async () => {
    await touch(false);
  });

  const layout = (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, padding: 24 }}>
      <Button size="sm">Salvar</Button>
      <IconButton size="sm" icon={<Arrow />} label="Avançar" />
      <Button size="md">Salvar</Button>
    </div>
  );

  it('with a fine pointer, sm takes only its own 32', async () => {
    const el = await render(layout);
    expect(matchMedia('(pointer: coarse)').matches).toBe(false);
    const [sm, icon] = el.querySelectorAll('button');
    const r = sm.getBoundingClientRect();
    expect(document.elementFromPoint(r.left + r.width / 2, r.top - 2)).not.toBe(sm);
    const i = icon.getBoundingClientRect();
    expect(document.elementFromPoint(i.left - 2, i.top + i.height / 2)).not.toBe(icon);
  });

  it('with a coarse pointer, sm takes the touch 6px around it (44), without moving the layout or the focus ring', async () => {
    await touch(true);
    const el = await render(layout);
    expect(matchMedia('(pointer: coarse)').matches).toBe(true);
    const [sm, icon, md] = el.querySelectorAll('button');
    const r = sm.getBoundingClientRect();
    expect(r.height).toBe(32);
    const x = r.left + r.width / 2;
    expect(document.elementFromPoint(x, r.top - 5.5)).toBe(sm);
    expect(document.elementFromPoint(x, r.bottom + 5.5)).toBe(sm);
    expect(document.elementFromPoint(x, r.top - 7)).not.toBe(sm);
    // The Button is already wider than 44: the layer grows it only vertically.
    expect(document.elementFromPoint(r.left - 2, r.top + r.height / 2)).not.toBe(sm);
    // The IconButton is a 32 square: the layer grows it on every side, to 44 × 44.
    const i = icon.getBoundingClientRect();
    expect([i.width, i.height]).toEqual([32, 32]);
    const y = i.top + i.height / 2;
    expect(document.elementFromPoint(i.left - 5.5, y)).toBe(icon);
    expect(document.elementFromPoint(i.right + 5.5, y)).toBe(icon);
    expect(document.elementFromPoint(i.left + i.width / 2, i.top - 5.5)).toBe(icon);
    expect(document.elementFromPoint(i.left - 7, y)).not.toBe(icon);
    // md is already 44: no layer.
    expect(getComputedStyle(md, '::after').content).toBe('none');
    // The layer paints nothing; the focus ring stays the button's own outline.
    const after = getComputedStyle(sm, '::after');
    expect(after.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(after.borderTopStyle).toBe('none');
    expect(after.outlineStyle).toBe('none');
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Button behaviour', () => {
  it('neutral outline and ghost on the rojao light theme pass axe (text/heading is navy)', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 8 }}>
        <Button tone="neutral" variant="outline">Ver o pedido</Button>
        <Button tone="neutral" variant="ghost">Ver o pedido</Button>
      </div>,
      'light',
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('disabled stays focusable and ignores clicks', async () => {
    const onClick = vi.fn();
    const el = await render(<Button disabled onClick={onClick}>Salvar</Button>);
    const b = el.querySelector('button')!;
    b.focus();
    expect(document.activeElement).toBe(b);
    expect(b.getAttribute('aria-disabled')).toBe('true');
    b.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('loading is busy, ignores clicks and announces the label', async () => {
    const onClick = vi.fn();
    const el = await render(<Button loading loadingLabel="Salvando…" onClick={onClick}>Salvar</Button>);
    const b = el.querySelector('button')!;
    expect(b.getAttribute('aria-busy')).toBe('true');
    b.click();
    expect(onClick).not.toHaveBeenCalled();
    await vi.waitFor(() =>
      expect(document.querySelector('[data-rds-announcer]')?.textContent).toBe('Salvando…'),
    );
    expect(b.getBoundingClientRect().height).toBe(44);
  });

  it('asChild renders a link with the button look', async () => {
    const el = await render(
      <Button asChild variant="outline">
        <a href="#pedido">Ver o pedido</a>
      </Button>,
    );
    const a = el.querySelector('a')!;
    expect(a.className).toContain('rds-button--outline');
    expect(el.querySelector('button')).toBeNull();
    expect(await axeViolations(el)).toEqual([]);
  });

  it('IconButton is named by its label', async () => {
    const el = await render(<IconButton icon={<Arrow />} label="Fechar" tone="neutral" variant="ghost" />);
    expect(el.querySelector('button')!.getAttribute('aria-label')).toBe('Fechar');
    expect(await axeViolations(el)).toEqual([]);
  });
});
