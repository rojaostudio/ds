import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './button';
import { Card, CardContent, CardFooter, CardHeader, type CardSize, type CardSurface } from './card';
import { IconButton } from './icon-button';
import { MoreVerticalIcon, InfoIcon } from './internal/icons';
import { Tile } from './tile';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const SIZES: CardSize[] = ['default', 'sm'];

const full = (surface: CardSurface, size: CardSize) => (
  <Card key={`${surface}-${size}`} surface={surface} size={size}>
    <CardHeader
      title="Plano Essencial"
      description="Para quem está começando"
      icon={<Tile icon={<InfoIcon />} variant="soft" size={size === 'sm' ? 'sm' : 'default'} />}
      action={<IconButton icon={<MoreVerticalIcon />} label="Mais ações" tone="neutral" variant="ghost" />}
    />
    <CardContent>
      <p style={{ margin: 0 }}>Até 3 pedidos abertos ao mesmo tempo.</p>
    </CardContent>
    <CardFooter note="Cancele quando quiser.">
      <Button variant="outline">Comparar</Button>
      <Button>Assinar</Button>
    </CardFooter>
  </Card>
);

// The tint card in dark used to fail (card/description 3.6:1, the footer note 3.5:1, the outline Button 2.1:1) on a
// strong orange tint (#b34b00): that tint was the generator's, not the Figma's. The rojao theme is the Figma table
// now (surface/tint blue/800 in dark) and the whole card passes.

describe.each(MODES)('Card (%s)', (mode) => {
  it('surface default, both sizes, with header, content and footer, passes axe', async () => {
    const el = await render(<div style={{ display: 'grid', gap: 16, maxWidth: 400 }}>{SIZES.map((size) => full('default', size))}</div>, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Card (tint)', () => {
  it('surface tint, both sizes, passes axe in light', async () => {
    const el = await render(<div style={{ display: 'grid', gap: 16, maxWidth: 400 }}>{SIZES.map((size) => full('tint', size))}</div>, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('surface tint, both sizes, passes axe in dark', async () => {
    const el = await render(<div style={{ display: 'grid', gap: 16, maxWidth: 400 }}>{SIZES.map((size) => full('tint', size))}</div>, 'dark');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the title (card/title → text/heading, navy) passes axe on the rojao light theme', async () => {
    const el = await render(full('default', 'default'), 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('surface tint passes axe in dark (description, note and outline action on the blue tint of the Figma)', async () => {
    const el = await render(full('tint', 'default'), 'dark');
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Card behaviour', () => {
  it('is an article named by its title; header and footer are optional', async () => {
    const el = await render(
      <div>
        <Card>
          <CardHeader title="Resumo" titleAs="h2" />
          <CardContent>Texto</CardContent>
        </Card>
        <Card as="div">
          <CardContent>Só conteúdo</CardContent>
        </Card>
      </div>,
    );
    const [article, plain] = el.querySelectorAll('.rds-card');
    expect(article.tagName).toBe('ARTICLE');
    const title = article.querySelector('h2')!;
    expect(article.getAttribute('aria-labelledby')).toBe(title.id);
    expect(plain.tagName).toBe('DIV');
    expect(plain.getAttribute('aria-labelledby')).toBeNull();
    expect(plain.querySelector('header, footer')).toBeNull();
  });

  it('default pads 16 and sm pads 12; tint has no border colour', async () => {
    const el = await render(
      <div>
        <Card>
          <CardContent>A</CardContent>
        </Card>
        <Card size="sm" surface="tint">
          <CardContent>B</CardContent>
        </Card>
      </div>,
    );
    const [a, b] = el.querySelectorAll<HTMLElement>('.rds-card__content');
    expect(getComputedStyle(a).paddingTop).toBe('16px');
    expect(getComputedStyle(b).paddingTop).toBe('12px');
    expect(getComputedStyle(el.querySelectorAll('.rds-card')[1]).borderTopColor).toBe('rgba(0, 0, 0, 0)');
  });
});
