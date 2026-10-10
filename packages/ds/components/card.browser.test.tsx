import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './button';
import { Card, CardContent, CardFooter, CardHeader, type CardSize, type CardVariant } from './card';
import { IconButton } from './icon-button';
import { MoreVerticalIcon, InfoIcon } from './internal/icons';
import { Tile } from './tile';
import { Switch } from './switch';
import { MODES, SCHEMES, axeViolations, cleanup, render, renderIn, setMedia } from './__tests__/render';

afterEach(async () => {
  await setMedia(null);
  cleanup();
});

const SIZES: CardSize[] = ['md', 'sm'];
const SURFACES: CardVariant[] = ['surface', 'outline', 'soft'];

// The footer of the Figma: the secondary action a neutral ghost Button, the main one (action fill) last.
const full = (variant: CardVariant, size: CardSize) => (
  <Card key={`${variant}-${size}`} variant={variant} size={size}>
    <CardHeader
      title="Plano Essencial"
      description="Para quem está começando"
      icon={<Tile icon={<InfoIcon />} variant="soft" size={size === 'sm' ? 'sm' : 'md'} />}
      action={<IconButton icon={<MoreVerticalIcon />} label="Mais ações" tone="neutral" variant="ghost" />}
    />
    <CardContent>
      <p style={{ margin: 0 }}>Até 3 pedidos abertos ao mesmo tempo.</p>
    </CardContent>
    <CardFooter note="Cancele quando quiser.">
      <Button tone="neutral" variant="ghost">
        Comparar
      </Button>
      <Button>Assinar</Button>
    </CardFooter>
  </Card>
);

// The tint card in dark used to fail (card/description 3.6:1, the footer note 3.5:1, the outline Button 2.1:1) on a
// strong orange tint (#b34b00): that tint was the generator's, not the Figma's. The rojao theme is the Figma table
// now (surface/tint blue/800 in dark) and the whole card passes; the tint title reads card/tint/title (text/on/tint).

describe.each(MODES)('Card (%s)', (mode) => {
  it.each(SURFACES)('variant %s, both sizes, with header, content and footer, passes axe', async (surface) => {
    const el = await render(<div style={{ display: 'grid', gap: 16, maxWidth: 400 }}>{SIZES.map((size) => full(surface, size))}</div>, mode);
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

  it('md pads 24 and sm pads 16, 24 between header, content and actions', async () => {
    const el = await render(
      <div>
        {full('surface', 'md')}
        {full('surface', 'sm')}
      </div>,
    );
    const [big, small] = el.querySelectorAll<HTMLElement>('.rds-card');
    const pads = (card: HTMLElement) => ({
      header: getComputedStyle(card.querySelector('.rds-card__header')!).paddingTop,
      content: getComputedStyle(card.querySelector('.rds-card__content')!).padding,
      footer: getComputedStyle(card.querySelector('.rds-card__footer')!).padding,
    });
    expect(pads(big)).toEqual({ header: '24px', content: '24px', footer: '0px 24px 24px' });
    expect(pads(small)).toEqual({ header: '16px', content: '16px', footer: '0px 16px 16px' });
  });

  it('surface has border and shadow; outline only the border, no fill nor shadow; soft the plate, no border nor shadow', async () => {
    const el = await render(<div style={{ display: 'grid', gap: 16, maxWidth: 400 }}>{SURFACES.map((surface) => full(surface, 'md'))}</div>);
    const [d, o, t] = [...el.querySelectorAll<HTMLElement>('.rds-card')].map((c) => getComputedStyle(c));
    const transparent = 'rgba(0, 0, 0, 0)';
    expect(d.borderTopColor).not.toBe(transparent);
    expect(d.boxShadow).not.toBe('none');
    expect(d.backgroundColor).not.toBe(transparent);
    expect(o.borderTopColor).toBe(d.borderTopColor);
    expect(o.boxShadow).toBe('none');
    expect(o.backgroundColor).toBe(transparent);
    expect(t.borderTopColor).toBe(transparent);
    expect(t.boxShadow).toBe('none');
    expect(t.backgroundColor).not.toBe(d.backgroundColor);
  });

  it('the soft title reads card/tint/title; the others card/title', async () => {
    const el = await render(<div>{SURFACES.map((surface) => full(surface, 'md'))}</div>);
    const [d, o, t] = [...el.querySelectorAll<HTMLElement>('.rds-card__title')].map((x) => getComputedStyle(x).color);
    const probe = document.createElement('span');
    el.append(probe);
    probe.style.color = 'var(--card-tint-title)';
    const tintTitle = getComputedStyle(probe).color;
    probe.style.color = 'var(--card-title)';
    const title = getComputedStyle(probe).color;
    expect([d, o, t]).toEqual([title, title, tintTitle]);
  });

  it('the footer has no band and no rule; the actions sit side by side, 12 apart, at the end', async () => {
    const el = await render(<div style={{ maxWidth: 400 }}>{full('surface', 'md')}</div>);
    const footer = el.querySelector<HTMLElement>('.rds-card__footer')!;
    expect(getComputedStyle(footer).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(footer).borderTopWidth).toBe('0px');
    const [secondary, main] = footer.querySelectorAll<HTMLElement>('.rds-button');
    const a = secondary.getBoundingClientRect();
    const b = main.getBoundingClientRect();
    expect(a.top).toBe(b.top);
    expect(b.left - a.right).toBe(12);
    expect(footer.getBoundingClientRect().right - b.right).toBe(24);
  });

  it('align="full" puts the two actions side by side, half each', async () => {
    const el = await render(
      <div style={{ width: 360 }}>
        <Card>
          <CardContent>Pix</CardContent>
          <CardFooter align="full">
            <Button tone="neutral" variant="ghost">
              Voltar
            </Button>
            <Button>Pagar</Button>
          </CardFooter>
        </Card>
      </div>,
    );
    const [a, b] = [...el.querySelectorAll<HTMLElement>('.rds-card__footer .rds-button')].map((x) => x.getBoundingClientRect());
    expect(a.top).toBe(b.top);
    expect(Math.abs(a.width - b.width)).toBeLessThan(1);
  });

  // Figma .card/header (04/10): with align=start the action sits in a band as tall as the title's line (24 on md, 20
  // on sm), centred in it, with or without a description.
  it.each(SIZES)('align=start, %s: the action band is the title line, the action centred on it, with or without a description', async (size) => {
    const line = size === 'sm' ? 20 : 24;
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 400 }}>
        {[true, false].map((withDescription) => (
          <Card key={String(withDescription)} size={size}>
            <CardHeader
              title="Resumo"
              description={withDescription ? 'Duas linhas de descrição para ver que a ação não desce com ela.' : undefined}
              action={<IconButton icon={<MoreVerticalIcon />} label="Mais ações" tone="neutral" variant="ghost" />}
            />
          </Card>
        ))}
      </div>,
    );
    for (const card of el.querySelectorAll('.rds-card')) {
      const band = card.querySelector('.rds-card__action')!.getBoundingClientRect();
      const title = card.querySelector('.rds-card__title')!.getBoundingClientRect();
      const button = card.querySelector('.rds-card__action button')!.getBoundingClientRect();
      expect(band.height).toBe(line);
      expect(band.top).toBe(title.top);
      expect(Math.round(button.top + button.height / 2)).toBe(Math.round(title.top + line / 2));
      // Nothing clips the 44 button.
      expect(getComputedStyle(card.querySelector('.rds-card__action')!).overflow).toBe('visible');
    }
  });

  it('align=center keeps the action out of the band (unchanged)', async () => {
    const el = await render(
      <Card>
        <CardHeader title="Resumo" align="center" action={<Button variant="ghost">Ver</Button>} />
      </Card>,
    );
    expect(el.querySelector('.rds-card__action')!.getBoundingClientRect().height).toBe(44);
  });

  it('the header action is opt-in', async () => {
    const el = await render(
      <Card>
        <CardHeader title="Resumo" />
      </Card>,
    );
    expect(el.querySelector('.rds-card__action')).toBeNull();
  });
});

describe.each(SCHEMES)('Card header action (%s)', (scheme) => {
  it('a Switch or an IconButton in the header passes axe, in both sizes', async () => {
    const el = await renderIn(
      <div style={{ display: 'grid', gap: 16, maxWidth: 400 }}>
        {SIZES.map((size) => (
          <Card key={size} size={size}>
            <CardHeader title="Avisos" description="Pedidos novos" action={<Switch size="sm">Ativar avisos</Switch>} />
            <CardContent>Texto</CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader title="Plano" action={<IconButton icon={<MoreVerticalIcon />} label="Mais ações" tone="neutral" variant="ghost" />} />
        </Card>
      </div>,
      scheme,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

// variant="inverse": the brand's dark fill (surface/inverse), text and icons in text/on-inverse, the description in
// text/on-inverse-subtle. Measured in light, dark and print (Chromium in the print media type).
const rgba = (c: string) => {
  const m = c.match(/rgba?\(([^)]+)\)/)!;
  const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return [r, g, b, a] as const;
};
const lum = ([r, g, b]: readonly number[]) => {
  const ch = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
/** Contrast of a (possibly translucent) colour over an opaque one. */
const contrast = (fg: string, bg: string) => {
  const [r, g, b, a] = rgba(fg);
  const back = rgba(bg);
  const front = [r * a + back[0] * (1 - a), g * a + back[1] * (1 - a), b * a + back[2] * (1 - a)];
  const [x, y] = [lum(front), lum(back)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const inverse = (
  <Card variant="inverse">
    <CardHeader title="Saldo do mês" description="Atualizado agora" />
    <CardContent>
      <p style={{ margin: 0 }}>
        <span className="probe-icon" aria-hidden="true" style={{ display: 'inline-block', width: 16, height: 16 }}>
          <InfoIcon />
        </span>{' '}
        R$ 12.400,00 em 38 pedidos.
      </p>
    </CardContent>
    <CardFooter note="Fecha no dia 30.">{null}</CardFooter>
  </Card>
);

describe.each(['light', 'dark', 'print'] as const)('Card variant="inverse" (%s)', (mode) => {
  it('passes axe; title, content, icon and note in text/on-inverse, the description in text/on-inverse-subtle, AA on the fill', async () => {
    if (mode === 'print') await setMedia('print');
    const el = await render(<div style={{ maxWidth: 400 }}>{inverse}</div>, mode === 'dark' ? 'dark' : 'light');
    expect(await axeViolations(el)).toEqual([]);
    const card = el.querySelector<HTMLElement>('.rds-card')!;
    const s = getComputedStyle(card);
    const probe = document.createElement('span');
    card.append(probe);
    const resolve = (v: string) => {
      probe.style.color = `var(${v})`;
      return getComputedStyle(probe).color;
    };
    expect(s.backgroundColor).toBe(resolve('--surface-inverse'));
    expect(s.borderTopColor).toBe('rgba(0, 0, 0, 0)');
    expect(s.boxShadow).toBe('none');
    const on = resolve('--text-on-inverse');
    const color = (sel: string) => getComputedStyle(card.querySelector<HTMLElement>(sel)!).color;
    for (const sel of ['.rds-card__title', '.rds-card__content', '.probe-icon', '.rds-card__note']) expect(color(sel), sel).toBe(on);
    expect(color('.rds-card__description')).toBe(resolve('--text-on-inverse-subtle'));
    for (const sel of ['.rds-card__title', '.rds-card__description', '.rds-card__note'])
      expect(contrast(color(sel), s.backgroundColor), sel).toBeGreaterThanOrEqual(4.5);
    if (mode === 'dark') expect(s.backgroundColor).toBe('rgb(255, 255, 255)');
    // Print keeps the fill: a full fill, not a background the print mode turns white.
    if (mode === 'print') expect(s.backgroundColor).not.toBe('rgb(255, 255, 255)');
  });
});
