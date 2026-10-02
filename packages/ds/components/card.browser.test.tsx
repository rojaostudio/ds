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

// Violations of the Figma itself, kept out of the matrix and pinned with it.fails below:
// - card/title → text/heading, flare on the rojao light theme (2.9:1 on white, 1.9:1 on the tint);
// - the tint card in dark: surface/tint is a strong orange (#b34b00, footer #d95a00), so card/description
//   (text/muted, 3.6:1), the footer note (text/body, bound straight to the theme in .card/footer, 3.5:1) and the
//   action outline Button (2.1:1) all fail on it.
const KNOWN_LIGHT_TITLE = (mode: string) => (mode === 'light' ? ['.rds-card__title'] : []);

describe.each(MODES)('Card (%s)', (mode) => {
  it('surface default, both sizes, with header, content and footer, passes axe', async () => {
    const el = await render(<div style={{ display: 'grid', gap: 16, maxWidth: 400 }}>{SIZES.map((size) => full('default', size))}</div>, mode);
    expect(await axeViolations(el, KNOWN_LIGHT_TITLE(mode))).toEqual([]);
  });
});

describe('Card (tint)', () => {
  it('surface tint, both sizes, passes axe in light (title aside)', async () => {
    const el = await render(<div style={{ display: 'grid', gap: 16, maxWidth: 400 }}>{SIZES.map((size) => full('tint', size))}</div>, 'light');
    expect(await axeViolations(el, KNOWN_LIGHT_TITLE('light'))).toEqual([]);
  });

  it('surface tint, both sizes, passes axe in dark apart from the three known pieces', async () => {
    const el = await render(<div style={{ display: 'grid', gap: 16, maxWidth: 400 }}>{SIZES.map((size) => full('tint', size))}</div>, 'dark');
    const known = ['.rds-card__description', '.rds-card__note', '.rds-card__footer .rds-button--outline'];
    expect(await axeViolations(el, known)).toEqual([]);
  });

  it.fails('the title (card/title → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(full('default', 'default'), 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it.fails('surface tint passes axe in dark (description, note and outline action on the orange tint)', async () => {
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
