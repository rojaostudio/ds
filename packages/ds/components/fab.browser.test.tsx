import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { FAB, FABProvider, FABRoot, usePageFAB, type FABConfig } from './fab';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const Plus = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

describe.each(MODES)('FAB (%s)', (mode) => {
  it('with and without icon, enabled and disabled, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 16 }}>
        <FAB>Novo pedido</FAB>
        <FAB icon={<Plus />}>Novo pedido</FAB>
        <FAB icon={<Plus />} disabled>Novo pedido</FAB>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('is 56px tall', async () => {
    const el = await render(<FAB icon={<Plus />}>Novo pedido</FAB>, mode);
    expect(el.querySelector('button')!.getBoundingClientRect().height).toBe(56);
  });
});

describe('FAB behaviour', () => {
  it('on hover the fill holds and the shadow rises from elevation/raised to elevation/overlay', async () => {
    const el = await render(
      <div style={{ padding: 32 }}>
        <FAB icon={<Plus />}>Novo pedido</FAB>
      </div>,
    );
    const b = el.querySelector('button')!;
    const shadow = (v: string) => {
      const probe = document.createElement('div');
      el.append(probe);
      probe.style.boxShadow = `var(${v})`;
      const s = getComputedStyle(probe).boxShadow;
      probe.remove();
      return s;
    };
    const rest = getComputedStyle(b);
    const fill = rest.backgroundColor;
    expect(rest.boxShadow).toBe(shadow('--elevation-raised'));
    // The pointer is shared by the test files running in parallel: hover again on every retry, so another file
    // moving the mouse cannot leave this one waiting on a hover it lost.
    await vi.waitFor(
      async () => {
        await userEvent.hover(b);
        expect(getComputedStyle(b).boxShadow).toBe(shadow('--elevation-overlay'));
      },
      { timeout: 5000, interval: 100 },
    );
    expect(getComputedStyle(b).backgroundColor).toBe(fill);
    await userEvent.unhover(b);
  });

  it('the label is the accessible name; the icon is hidden', async () => {
    const el = await render(<FAB icon={<Plus />}>Novo pedido</FAB>);
    expect(el.querySelector('button')!.textContent).toBe('Novo pedido');
    expect(el.querySelector('.rds-fab__icon')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('disabled stays focusable and ignores clicks', async () => {
    const onClick = vi.fn();
    const el = await render(<FAB disabled onClick={onClick}>Novo pedido</FAB>);
    const b = el.querySelector('button')!;
    b.focus();
    expect(document.activeElement).toBe(b);
    expect(b.getAttribute('aria-disabled')).toBe('true');
    b.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('asChild renders a link with the FAB look (no router imported)', async () => {
    const el = await render(
      <FAB asChild icon={<Plus />}>
        <a href="#nova">Novo pedido</a>
      </FAB>,
    );
    const a = el.querySelector('a')!;
    expect(a.className).toContain('rds-fab');
    expect(a.querySelector('.rds-fab__icon')).not.toBeNull();
    expect(el.querySelector('button')).toBeNull();
    expect(await axeViolations(el)).toEqual([]);
  });
});

/** CSS colours painted in order on one canvas pixel (alpha composited), read back as sRGB 0-255. */
function paint(...layers: string[]): [number, number, number] {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
  for (const css of layers) {
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
  }
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}
const luminance = ([r, g, b]: [number, number, number]) => {
  const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (a: [number, number, number], b: [number, number, number]) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const pill = (el: HTMLElement) => el.querySelector<HTMLElement>('.rds-fab__count');

describe.each(MODES)('FAB count (%s)', (mode) => {
  it('with a count, enabled and disabled, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 16 }}>
        <FAB icon={<Plus />} count={12} countLabel="itens">Carrinho</FAB>
        <FAB count={120}>Carrinho</FAB>
        <FAB icon={<Plus />} count={3} disabled>Carrinho</FAB>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the number on its pill reaches 4.5:1 over the FAB fill, at rest and on hover', async () => {
    const el = await render(<FAB icon={<Plus />} count={12}>Carrinho</FAB>, mode);
    const p = pill(el)!;
    const probe = (v: string) => {
      const span = document.createElement('span');
      el.append(span);
      span.style.color = `var(${v})`;
      const c = getComputedStyle(span).color;
      span.remove();
      return c;
    };
    for (const fill of [getComputedStyle(el.querySelector('button')!).backgroundColor, probe('--fab-cta-background-hover')]) {
      // The pill is fab/count/background at 20% over the fill; the number sits on that composite.
      const under = paint('#ffffff', fill, getComputedStyle(p).backgroundColor);
      const number = paint('#ffffff', fill, getComputedStyle(p).backgroundColor, getComputedStyle(p).color);
      expect(ratio(number, under)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('FAB count', () => {
  it('a pill after the label, the number bold and tabular; the count joins the name', async () => {
    const el = await render(<FAB icon={<Plus />} count={12} countLabel="itens">Carrinho</FAB>);
    const b = el.querySelector('button')!;
    expect(b.getAttribute('aria-label')).toBe('Carrinho, 12 itens');
    const p = pill(el)!;
    expect(p.textContent).toBe('12');
    expect(p.getAttribute('aria-hidden')).toBe('true');
    expect(b.lastElementChild).toBe(p);
    const style = getComputedStyle(p);
    expect(style.display).not.toBe('none');
    expect(style.fontWeight).toBe('700');
    expect(style.fontVariantNumeric).toBe('tabular-nums');
    // type/small (14/20) on a 20 pill: 24 minimum, 8 on each side.
    expect(style.fontSize).toBe('14px');
    expect(style.lineHeight).toBe('20px');
    expect(style.paddingLeft).toBe('8px');
    expect(style.paddingRight).toBe('8px');
    expect(p.getBoundingClientRect().height).toBe(20);
    expect(p.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
    expect(p.getBoundingClientRect().width).toBeGreaterThan(0);
    // After the label, inside the 56 pill.
    const label = b.childNodes[1];
    const range = document.createRange();
    range.selectNodeContents(label);
    expect(p.getBoundingClientRect().left).toBeGreaterThan(range.getBoundingClientRect().right);
    expect(b.getBoundingClientRect().height).toBe(56);
  });

  it('"99+" above 99, the real number in the name; without countLabel the name is "label, N"', async () => {
    let el = await render(<FAB count={120} countLabel="itens">Carrinho</FAB>);
    expect(pill(el)!.textContent).toBe('99+');
    expect(el.querySelector('button')!.getAttribute('aria-label')).toBe('Carrinho, 120 itens');
    cleanup();
    el = await render(<FAB count={99}>Carrinho</FAB>);
    expect(pill(el)!.textContent).toBe('99');
    expect(el.querySelector('button')!.getAttribute('aria-label')).toBe('Carrinho, 99');
  });

  it('gone with 0 or undefined: no pill, the plain label', async () => {
    for (const count of [0, undefined]) {
      cleanup();
      const el = await render(<FAB count={count} countLabel="itens">Carrinho</FAB>);
      expect(pill(el)).toBeNull();
      const b = el.querySelector('button')!;
      expect(b.hasAttribute('aria-label')).toBe(false);
      expect(b.textContent).toBe('Carrinho');
    }
  });

  it('with asChild the link carries the pill and a hidden suffix for the name', async () => {
    const el = await render(
      <FAB asChild icon={<Plus />} count={5} countLabel="itens">
        <a href="#carrinho">Carrinho</a>
      </FAB>,
    );
    const a = el.querySelector('a')!;
    expect(pill(el)!.textContent).toBe('5');
    expect(a.querySelector('.rds-visually-hidden')!.textContent).toBe(', 5 itens');
    // The name is the text a screen reader reads: the pill is hidden, the suffix is not.
    const read = [...a.childNodes]
      .filter((n) => !(n instanceof HTMLElement && n.getAttribute('aria-hidden') === 'true'))
      .map((n) => n.textContent)
      .join('');
    expect(read).toBe('Carrinho, 5 itens');
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('FABRoot (usePageFAB)', () => {
  function Page(config: FABConfig) {
    usePageFAB(config, [config.count, config.icon]);
    return null;
  }
  const page = (config: FABConfig) => (
    <FABProvider>
      <Page {...config} />
      <FABRoot />
    </FABProvider>
  );
  const Cart = () => (
    <svg viewBox="0 0 24 24" data-icon="cart">
      <path d="M4 4h16v16H4z" />
    </svg>
  );

  it('passes count and countLabel to the FAB, on a button and on a link', async () => {
    let el = await render(page({ label: 'Carrinho', count: 12, countLabel: 'itens', onClick: () => {} }));
    await vi.waitFor(() => expect(el.querySelector('.rds-fab__count')?.textContent).toBe('12'));
    expect(el.querySelector('button.rds-fab')!.getAttribute('aria-label')).toBe('Carrinho, 12 itens');
    cleanup();
    el = await render(page({ label: 'Carrinho', count: 120, href: '#carrinho' }));
    await vi.waitFor(() => expect(el.querySelector('a.rds-fab .rds-fab__count')?.textContent).toBe('99+'));
    expect(el.querySelector('a.rds-fab .rds-visually-hidden')!.textContent).toBe(', 120');
  });

  it('a plus by default; a given icon replaces it, with or without a count', async () => {
    let el = await render(page({ label: 'Novo pedido', onClick: () => {} }));
    await vi.waitFor(() => expect(el.querySelector('.rds-fab__icon svg')).not.toBeNull());
    expect(el.querySelector('[data-icon="cart"]')).toBeNull();
    cleanup();
    el = await render(page({ label: 'Carrinho', icon: <Cart />, count: 2, onClick: () => {} }));
    await vi.waitFor(() => expect(el.querySelector('.rds-fab__icon [data-icon="cart"]')).not.toBeNull());
    expect(el.querySelectorAll('.rds-fab__icon svg')).toHaveLength(1);
    expect(el.querySelector('.rds-fab__count')!.textContent).toBe('2');
  });
});
