import { afterEach, describe, expect, it } from 'vitest';
import { Badge } from './badge';
import { Item } from './item';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// ds#133: Badge size sm, 24 tall, beside the title of a row.

describe('Badge size', () => {
  it('md is 32 and sm 24; the number is a circle of the same size', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Badge>Interna</Badge>
        <Badge size="sm">Interna</Badge>
        <Badge value={8} />
        <Badge size="sm" value={8} />
      </div>,
    );
    const [md, sm, nmd, nsm] = Array.from(el.querySelectorAll<HTMLElement>('.rds-badge')).map((b) => b.getBoundingClientRect());
    expect(md.height).toBe(32);
    expect(sm.height).toBe(24);
    expect([nmd.width, nmd.height]).toEqual([32, 32]);
    expect([nsm.width, nsm.height]).toEqual([24, 24]);
  });

  it('an sm Badge beside the title keeps the row height', async () => {
    const el = await render(
      <div style={{ width: 480 }}>
        <Item variant="row" title="Loja Centro" description="12 pedidos" />
        <Item
          variant="row"
          title={
            <>
              Loja Centro <Badge size="sm">Interna</Badge>
            </>
          }
          description="12 pedidos"
        />
      </div>,
    );
    const [a, b] = Array.from(el.querySelectorAll<HTMLElement>('.rds-item')).map((r) => r.getBoundingClientRect().height);
    expect(b).toBe(a);
  });

  it.each(MODES)('passes axe (%s)', async (mode) => {
    const el = await render(
      <div style={{ display: 'flex', gap: 8 }}>
        <Badge size="sm" tone="action" variant="soft">
          Interna
        </Badge>
        <Badge size="sm" tone="accent" variant="soft" value={3} />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});
