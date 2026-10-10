import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { page } from 'vitest/browser';
import { Banner } from './banner';
import { Button } from './button';
import { InContainer, WIDTHS } from './__tests__/blocks';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const block = (onClose?: () => void) => (
  <Banner highlight="Novidade:" message="Veja os produtos que chegaram esta semana." action={<Button variant="ghost">Ver produtos</Button>} onClose={onClose ?? (() => {})} />
);

describe.each(MODES)('Banner (%s)', (mode) => {
  it.each(WIDTHS)('in a %i container passes axe', async (width) => {
    const el = await render(<InContainer width={width}>{block()}</InContainer>, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Banner behaviour', () => {
  it('the highlight (banner/highlight → text/heading, navy) passes axe on the rojao light theme', async () => {
    const el = await render(<InContainer width={1024}>{block()}</InContainer>, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('follows the container, not the viewport: a row at 1024, stacked at 360', async () => {
    await page.viewport(414, 896);
    const wide = await render(<InContainer width={1024}>{block()}</InContainer>);
    expect(getComputedStyle(wide.querySelector('.rds-banner__body')!).flexDirection).toBe('row');
    expect(getComputedStyle(wide.querySelector('.rds-banner__content')!).justifyContent).toBe('center');
    await page.viewport(1280, 800);
    const narrow = await render(<InContainer width={360}>{block()}</InContainer>);
    expect(getComputedStyle(narrow.querySelector('.rds-banner__body')!).flexDirection).toBe('column');
    expect(getComputedStyle(narrow.querySelector('.rds-banner__highlight')!).display).toBe('block');
  });

  it('neutral by default: no attention classes, the Button the consumer passed untouched', async () => {
    const el = await render(<InContainer width={1024}>{block()}</InContainer>);
    expect(el.querySelector('.rds-banner')!.className).toBe('rds-banner');
    expect(el.querySelector('.rds-banner__action .rds-button')!.className).toContain('rds-button--ghost');
  });

  it('a named region; the × hides it, calls onClose and moves the focus on', async () => {
    const onClose = vi.fn();
    const el = await render(
      <InContainer width={1024}>
        {block(onClose)}
        <button>Depois</button>
      </InContainer>,
    );
    const region = el.querySelector('[role="region"]')!;
    expect(region.getAttribute('aria-label')).toBe('Aviso');
    expect(region.querySelector('.rds-banner__icon')!.getAttribute('aria-hidden')).toBe('true');
    const close = el.querySelector<HTMLButtonElement>('button[aria-label="Fechar aviso"]')!;
    close.focus();
    await act(async () => close.click());
    expect(el.querySelector('.rds-banner')).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
    await expect.poll(() => document.activeElement?.textContent).toBe('Depois');
  });
});

// The Taiq's trial: tone="attention" in three levels of amber.
const LEVELS = ['low', 'medium', 'high'] as const;
const trial = (level: (typeof LEVELS)[number]) => (
  <Banner
    tone="attention"
    level={level}
    label={`Período de teste, ${level}`}
    highlight="Faltam 3 dias:"
    message="o teste grátis termina na sexta."
    action={<Button>Assinar</Button>}
    onClose={() => {}}
  />
);

/** A CSS colour (any syntax, color-mix included) as sRGB 0-255, read back from a canvas pixel. */
function rgb(css: string): [number, number, number] {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#000';
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}
const luminance = ([r, g, b]: [number, number, number]) => {
  const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(rgb(a)), luminance(rgb(b))].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const chroma = (css: string) => Math.max(...rgb(css)) - Math.min(...rgb(css));
const hue = (css: string) => {
  const [r, g, b] = rgb(css).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};

describe.each(MODES)('Banner attention (%s)', (mode) => {
  it.each(WIDTHS)('the three levels in a %i container pass axe', async (width) => {
    const el = await render(
      <InContainer width={width}>
        {trial('low')}
        {trial('medium')}
        {trial('high')}
      </InContainer>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the background gets more saturated from low to high, always amber (never red); text and CTA keep 4.5:1', async () => {
    const el = await render(
      <InContainer width={1024}>
        {trial('low')}
        {trial('medium')}
        {trial('high')}
      </InContainer>,
      mode,
    );
    const banners = [...el.querySelectorAll<HTMLElement>('.rds-banner')];
    const backgrounds = banners.map((b) => getComputedStyle(b).backgroundColor);
    expect(chroma(backgrounds[0])).toBeLessThan(chroma(backgrounds[1]));
    expect(chroma(backgrounds[1])).toBeLessThan(chroma(backgrounds[2]));
    banners.forEach((banner, i) => {
      const bg = backgrounds[i];
      expect(hue(bg)).toBeGreaterThanOrEqual(25);
      expect(hue(bg)).toBeLessThanOrEqual(65);
      for (const part of ['.rds-banner__message', '.rds-banner__highlight', '.rds-banner__icon']) {
        expect(contrast(getComputedStyle(banner.querySelector(part)!).color, bg)).toBeGreaterThanOrEqual(4.5);
      }
      const cta = banner.querySelector<HTMLElement>('.rds-banner__action .rds-button')!;
      const ctaBg = getComputedStyle(cta).backgroundColor;
      // An outline CTA is transparent: its label sits on the strip.
      const plate = ctaBg === 'rgba(0, 0, 0, 0)' ? bg : ctaBg;
      expect(contrast(getComputedStyle(cta).color, plate)).toBeGreaterThanOrEqual(4.5);
      const close = banner.querySelector<HTMLElement>('.rds-banner__close')!;
      expect(contrast(getComputedStyle(close).color, bg)).toBeGreaterThanOrEqual(4.5);
    });
  });
});

describe('Banner attention behaviour', () => {
  it('the CTA is outline in low and medium, fill in high, whatever variant the consumer gave', async () => {
    for (const level of LEVELS) {
      cleanup();
      const el = await render(
        <InContainer width={1024}>
          <Banner tone="attention" level={level} message="O teste termina na sexta." action={<Button variant="ghost">Assinar</Button>} />
        </InContainer>,
      );
      const cta = el.querySelector<HTMLElement>('.rds-banner__action .rds-button')!;
      expect(cta.className).toContain(level === 'high' ? 'rds-button--fill' : 'rds-button--outline');
      expect(cta.className).toContain('rds-button--neutral');
      const banner = el.querySelector<HTMLElement>('.rds-banner')!;
      expect(banner.classList).toContain('rds-banner--attention');
      expect(banner.classList).toContain(`rds-banner--${level}`);
      if (level === 'high') {
        // The fill takes the strip's text colour as its plate and the strip's background as its label.
        expect(getComputedStyle(cta).backgroundColor).toBe(getComputedStyle(banner).color);
      } else {
        expect(getComputedStyle(cta).borderTopColor).toBe(getComputedStyle(banner).color);
      }
    }
  });

  it('level defaults to low; the layout follows the container: a row at 1024, stacked at 360', async () => {
    const wide = await render(
      <InContainer width={1024}>
        <Banner tone="attention" highlight="Faltam 3 dias:" message="o teste termina na sexta." action={<Button>Assinar</Button>} />
      </InContainer>,
    );
    expect(wide.querySelector('.rds-banner')!.classList).toContain('rds-banner--low');
    expect(getComputedStyle(wide.querySelector('.rds-banner__body')!).flexDirection).toBe('row');
    const narrow = await render(<InContainer width={360}>{trial('high')}</InContainer>);
    expect(getComputedStyle(narrow.querySelector('.rds-banner__body')!).flexDirection).toBe('column');
    expect(getComputedStyle(narrow.querySelector('.rds-banner__highlight')!).display).toBe('block');
  });

  it('a link CTA (Button asChild) gets the level variant too; a non-Button action is left as given', async () => {
    let el = await render(
      <InContainer width={1024}>
        <Banner
          tone="attention"
          level="high"
          message="O teste termina hoje."
          action={
            <Button asChild>
              <a href="/billing">Assinar</a>
            </Button>
          }
        />
      </InContainer>,
    );
    expect(el.querySelector('a.rds-button')!.className).toContain('rds-button--fill');
    el = await render(
      <InContainer width={1024}>
        <Banner tone="attention" level="high" message="O teste termina hoje." action={<a href="/billing">Assinar</a>} />
      </InContainer>,
    );
    expect(el.querySelector('.rds-banner__action a')!.className).toBe('');
  });
});
