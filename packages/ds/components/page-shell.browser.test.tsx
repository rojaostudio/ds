import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './button';
import { PageHeader } from './page-header';
import { PageShell, type PageShellWidth } from './page-shell';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('PageShell (%s)', (mode) => {
  it('with a PageHeader and the Body passes axe', async () => {
    const el = await render(
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
  it('is centred and capped at narrow 768, default 1280 and wide 1536', async () => {
    const widths: Record<PageShellWidth, string> = { narrow: '768px', default: '1280px', wide: '1536px' };
    for (const [maxWidth, px] of Object.entries(widths) as [PageShellWidth, string][]) {
      const el = await render(<PageShell maxWidth={maxWidth}>x</PageShell>);
      const shell = el.querySelector<HTMLElement>('.rds-page-shell')!;
      expect(getComputedStyle(shell).maxWidth).toBe(px);
      expect(getComputedStyle(shell).marginLeft).toBe(getComputedStyle(shell).marginRight);
    }
  });

  it('padded by default (24 on top), not with padded={false}; the body stacks 24 apart', async () => {
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
    expect(getComputedStyle(padded).paddingTop).toBe('24px');
    expect(getComputedStyle(bare).paddingTop).toBe('0px');
    expect(getComputedStyle(el.querySelector('.rds-page-shell__body')!).rowGap).toBe('24px');
  });
});
