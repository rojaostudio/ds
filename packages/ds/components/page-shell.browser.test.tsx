import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { Button } from './button';
import { PageHeader } from './page-header';
import { PageShell, type PageShellWidth } from './page-shell';
import { SCHEMES, axeViolations, cleanup, cssVar, render, renderIn } from './__tests__/render';

afterEach(cleanup);

describe.each(SCHEMES)('PageShell (%s)', (mode) => {
  it('with a PageHeader and the Body passes axe', async () => {
    const el = await renderIn(
      <PageShell>
        <PageHeader title="Pedidos" description="Mercado Azul" actions={<Button>Novo pedido</Button>} />
        <PageShell.Body>
          <p>Seção um</p>
          <p>Seção dois</p>
        </PageShell.Body>
      </PageShell>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('full and aligned to the start passes axe', async () => {
    const el = await renderIn(
      <PageShell maxWidth="full" align="start">
        <PageHeader title="Produção" description="Quadro da semana" />
        <PageShell.Body>
          <p>Coluna um</p>
        </PageShell.Body>
      </PageShell>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('PageShell behaviour', () => {
  it('is centred and capped at narrow 768, medium 1152 and wide 1536, full has no cap; wide is the default', async () => {
    const widths: Record<PageShellWidth, string> = { narrow: '768px', medium: '1152px', wide: '1536px', full: 'none' };
    for (const [maxWidth, px] of Object.entries(widths) as [PageShellWidth, string][]) {
      const el = await render(<PageShell maxWidth={maxWidth}>x</PageShell>);
      const shell = el.querySelector<HTMLElement>('.rds-page-shell')!;
      expect(getComputedStyle(shell).maxWidth).toBe(px);
      expect(getComputedStyle(shell).marginLeft).toBe(getComputedStyle(shell).marginRight);
    }
    const plain = await render(<PageShell>x</PageShell>);
    expect(plain.querySelector('.rds-page-shell')!.className).toContain('rds-page-shell--wide');
    expect(plain.querySelector('.rds-page-shell')!.className).not.toContain('align');
    expect(getComputedStyle(plain.querySelector('.rds-page-shell')!).maxWidth).toBe('1536px');
  });

  // Figma: layout/content/max-width/narrow, …/medium and …/wide; layout/form/max-width stays as an alias of narrow.
  it('reads narrow, medium and wide from the layout tokens, and keeps --layout-form-max-width', async () => {
    const el = await render(
      <div>
        <PageShell maxWidth="narrow">a</PageShell>
        <PageShell maxWidth="medium">c</PageShell>
        <PageShell maxWidth="wide">b</PageShell>
      </div>,
    );
    const [narrow, medium, wide] = el.querySelectorAll<HTMLElement>('.rds-page-shell');
    expect(getComputedStyle(narrow).maxWidth).toBe(cssVar('--layout-content-max-width-narrow'));
    expect(getComputedStyle(medium).maxWidth).toBe(cssVar('--layout-content-max-width-medium'));
    expect(getComputedStyle(wide).maxWidth).toBe(cssVar('--layout-content-max-width-wide'));
    expect(cssVar('--layout-form-max-width')).toBe('768px');
  });

  it('align="start" puts the capped content at the inline start; center (default) centres it', async () => {
    await page.viewport(1920, 900);
    const el = await render(
      <div>
        <div style={{ width: 1600 }} data-box="start">
          <PageShell maxWidth="narrow" align="start">a</PageShell>
        </div>
        <div style={{ width: 1600 }} data-box="center">
          <PageShell maxWidth="narrow">b</PageShell>
        </div>
        <div style={{ width: 1600 }} dir="rtl" data-box="rtl">
          <PageShell maxWidth="narrow" align="start">c</PageShell>
        </div>
      </div>,
    );
    const pick = (box: string) => {
      const parent = el.querySelector<HTMLElement>(`[data-box="${box}"]`)!;
      const shell = parent.querySelector<HTMLElement>('.rds-page-shell')!;
      return { parent: parent.getBoundingClientRect(), shell: shell.getBoundingClientRect(), s: getComputedStyle(shell), el: shell };
    };
    const start = pick('start');
    expect(start.el.className).toContain('rds-page-shell--align-start');
    expect(start.s.marginLeft).toBe('0px');
    expect(Math.round(start.shell.left)).toBe(Math.round(start.parent.left));
    const center = pick('center');
    expect(center.s.marginLeft).toBe(center.s.marginRight);
    expect(parseFloat(center.s.marginLeft)).toBeGreaterThan(0);
    const rtl = pick('rtl');
    expect(rtl.s.marginRight).toBe('0px');
    expect(Math.round(rtl.shell.right)).toBe(Math.round(rtl.parent.right));
    await page.viewport(1280, 900);
  });

  it('full fills the parent whatever the align, and keeps the margins', async () => {
    await page.viewport(1920, 900);
    const el = await render(
      <div style={{ width: 1600 }}>
        <PageShell maxWidth="full" align="start">a</PageShell>
        <PageShell maxWidth="full">b</PageShell>
      </div>,
    );
    for (const shell of el.querySelectorAll<HTMLElement>('.rds-page-shell')) {
      const s = getComputedStyle(shell);
      expect(Math.round(shell.getBoundingClientRect().width)).toBe(1600);
      expect([s.marginLeft, s.marginRight]).toEqual(['0px', '0px']);
      expect(s.paddingLeft).toBe(cssVar('--layout-content-padding-x'));
    }
    await page.viewport(1280, 900);
  });

  // Figma: layout/content/padding-y above and below, layout/content/padding-x at the sides, by the viewport mode.
  it.each([
    [390, '16px', '16px'],
    [640, '24px', '24px'],
    [768, '24px', '24px'],
    [1024, '32px', '32px'],
    [1280, '32px', '32px'],
    [1536, '32px', '48px'],
  ])('padded at %ipx: %s above and below, %s at the sides', async (width, y, x) => {
    await page.viewport(width, 800);
    const el = await render(<PageShell>x</PageShell>);
    const s = getComputedStyle(el.querySelector('.rds-page-shell')!);
    expect([s.paddingTop, s.paddingBottom]).toEqual([y, y]);
    expect([s.paddingLeft, s.paddingRight]).toEqual([x, x]);
    expect(s.paddingTop).toBe(cssVar('--layout-content-padding-y'));
    await page.viewport(1280, 900);
  });

  it('padded={false} takes the margins away; the body stacks 24 apart', async () => {
    const el = await render(
      <div>
        <PageShell>
          <PageShell.Body>
            <p>a</p>
            <p>b</p>
          </PageShell.Body>
        </PageShell>
        <PageShell padded={false}>y</PageShell>
      </div>,
    );
    const [padded, bare] = el.querySelectorAll<HTMLElement>('.rds-page-shell');
    expect(getComputedStyle(padded).paddingTop).not.toBe('0px');
    expect(getComputedStyle(bare).paddingTop).toBe('0px');
    expect(getComputedStyle(bare).paddingLeft).toBe('0px');
    expect(getComputedStyle(el.querySelector('.rds-page-shell__body')!).rowGap).toBe('24px');
  });

  it('puts the PageHeader 24 above the body', async () => {
    const el = await render(
      <PageShell padded={false}>
        <PageHeader title="Perguntas frequentes" description="O que os lojistas mais perguntam." />
        <PageShell.Body>
          <p>a</p>
        </PageShell.Body>
      </PageShell>,
    );
    const header = el.querySelector('.rds-page-header')!.getBoundingClientRect();
    const body = el.querySelector('.rds-page-shell__body')!.getBoundingClientRect();
    expect(Math.round(body.top - header.bottom)).toBe(24);
  });
});
