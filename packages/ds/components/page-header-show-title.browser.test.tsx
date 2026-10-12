import { afterEach, describe, expect, it } from 'vitest';
import { PageHeader } from './page-header';
import { Status } from './status';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// ds#136: PageHeader showTitle.

describe('PageHeader showTitle', () => {
  it('false: no visible title, help or addon; the description is the first line; the h1 stays for screen readers', async () => {
    const el = await render(
      <PageHeader
        showTitle={false}
        title="Pedidos"
        description="Os pedidos da loja, do mais novo ao mais antigo."
        help={{ label: 'Ajuda', onClick: () => {} }}
        titleAddon={<Status tone="info">Novo</Status>}
      />,
    );
    const h1 = el.querySelector('h1')!;
    expect(h1.textContent).toBe('Pedidos');
    expect(el.querySelector<HTMLElement>('.rds-page-header__title-row')!.getBoundingClientRect().height).toBeLessThanOrEqual(1);
    expect(el.querySelector('.rds-page-header__help')).toBeNull();
    expect(el.querySelector('.rds-page-header__addon')).toBeNull();
    const text = el.querySelector<HTMLElement>('.rds-page-header__text')!.getBoundingClientRect();
    const desc = el.querySelector<HTMLElement>('.rds-page-header__description')!.getBoundingClientRect();
    expect(Math.round(desc.top)).toBe(Math.round(text.top));
  });

  it('default: the title shows as before', async () => {
    const el = await render(<PageHeader title="Pedidos" description="Os pedidos da loja." />);
    expect(el.querySelector('h1')!.getBoundingClientRect().height).toBeGreaterThan(1);
  });

  it.each(MODES)('passes axe without the title (%s)', async (mode) => {
    const el = await render(<PageHeader showTitle={false} title="Pedidos" description="Os pedidos da loja." />, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});
