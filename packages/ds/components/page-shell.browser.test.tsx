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
});

describe('PageShell behaviour', () => {
  it('is centred and capped at narrow 768 and wide 1536; wide is the default', async () => {
    const widths: Record<PageShellWidth, string> = { narrow: '768px', wide: '1536px' };
    for (const [maxWidth, px] of Object.entries(widths) as [PageShellWidth, string][]) {
      const el = await render(<PageShell maxWidth={maxWidth}>x</PageShell>);
      const shell = el.querySelector<HTMLElement>('.rds-page-shell')!;
      expect(getComputedStyle(shell).maxWidth).toBe(px);
      expect(getComputedStyle(shell).marginLeft).toBe(getComputedStyle(shell).marginRight);
    }
    const plain = await render(<PageShell>x</PageShell>);
    expect(plain.querySelector('.rds-page-shell')!.className).toContain('rds-page-shell--wide');
    expect(getComputedStyle(plain.querySelector('.rds-page-shell')!).maxWidth).toBe('1536px');
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
});
