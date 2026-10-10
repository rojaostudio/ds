import { afterEach, describe, expect, it, vi } from 'vitest';
import { Alert, type AlertIconTone, type AlertTone } from './alert';
import { Button } from './button';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const TONES: AlertTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

describe.each(MODES)('Alert (%s)', (mode) => {
  it('every tone, with description, action and close, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8, maxWidth: 560 }}>
        {TONES.map((tone) => (
          <Alert
            key={tone}
            tone={tone}
            title="Seu perfil está oculto"
            description="Clientes não encontram você nas buscas. Torne o perfil visível para voltar a aparecer."
            action={<Button tone="neutral" variant="outline" size="sm">Tornar visível</Button>}
            onClose={() => {}}
          />
        ))}
        {TONES.map((tone) => (
          <Alert key={`${tone}-plain`} tone={tone} title="Seu perfil está oculto" showIcon={false} />
        ))}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Alert behaviour', () => {
  it('the neutral outline action on the rojao light theme passes axe (text/heading is navy)', async () => {
    const el = await render(
      <Alert title="Seu perfil está oculto" action={<Button tone="neutral" variant="outline" size="sm">Tornar visível</Button>} />,
      'light',
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('puts the action under the text below lg 1024 and beside it from 1024', async () => {
    const el = await render(
      <Alert title="1 conta vencida" action={<Button tone="neutral" variant="outline" size="sm">Ver vencidas</Button>} />,
    );
    const content = el.querySelector('.rds-alert__content') as HTMLElement;
    const wide = window.matchMedia('(min-width: 1024px)').matches;
    expect(getComputedStyle(content).flexDirection).toBe(wide ? 'row' : 'column');
  });

  it('has no role by default; status and alert when asked', async () => {
    const el = await render(
      <div>
        <Alert title="Já estava aqui" />
        <Alert title="Salvo" announce="status" />
        <Alert title="Falhou" tone="danger" announce="alert" />
      </div>,
    );
    const alerts = el.querySelectorAll('.rds-alert');
    expect(alerts[0].getAttribute('role')).toBeNull();
    expect(alerts[1].getAttribute('role')).toBe('status');
    expect(alerts[2].getAttribute('role')).toBe('alert');
  });

  it('the × is named, hides the alert, calls onClose and moves the focus to what comes next', async () => {
    const onClose = vi.fn();
    const el = await render(
      <div>
        <Alert title="Seu perfil está oculto" onClose={onClose} />
        <button type="button">Depois</button>
      </div>,
    );
    const close = el.querySelector<HTMLButtonElement>('[aria-label="Fechar aviso"]')!;
    close.focus();
    close.click();
    expect(onClose).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(el.querySelector('.rds-alert')).toBeNull());
    await vi.waitFor(() => expect(document.activeElement?.textContent).toBe('Depois'));
  });
});

// The Taiq's "you can sell" notice: a neutral strip, a green check, title and description on one line.
const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const ICON_TONES: AlertIconTone[] = ['info', 'success', 'warning', 'danger'];

/** A CSS colour as sRGB 0-255, read back from a canvas pixel. */
function rgb(css: string): [number, number, number] {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
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

describe.each(MODES)('Alert icon and layout (%s)', (mode) => {
  it('neutral with an iconTone and inline, passes axe; the icon keeps 3:1 on the neutral strip', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8, maxWidth: 560 }}>
        {ICON_TONES.map((iconTone) => (
          <Alert
            key={iconTone}
            icon={<Check />}
            iconTone={iconTone}
            layout="inline"
            title="Você já pode vender:"
            description="PDV, Pix e pedidos no WhatsApp."
            onClose={() => {}}
          />
        ))}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
    for (const alert of el.querySelectorAll<HTMLElement>('.rds-alert')) {
      const icon = getComputedStyle(alert.querySelector('.rds-alert__icon')!).color;
      expect(contrast(icon, getComputedStyle(alert).backgroundColor)).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('Alert icon and layout', () => {
  const probe = (host: Element, v: string) => {
    const span = document.createElement('span');
    host.append(span);
    span.style.color = `var(${v})`;
    const c = getComputedStyle(span).color;
    span.remove();
    return c;
  };

  it('icon replaces the tone icon; iconTone paints only the icon, the strip and the title stay neutral', async () => {
    const el = await render(
      <div>
        <Alert title="Neutro" />
        <Alert icon={<Check />} iconTone="success" title="Você já pode vender:" description="PDV, Pix e pedidos no WhatsApp." />
      </div>,
    );
    const [plain, sell] = el.querySelectorAll<HTMLElement>('.rds-alert');
    expect(sell.querySelector('.rds-alert__icon path')!.getAttribute('d')).toBe('M20 6 9 17l-5-5');
    expect(sell.querySelector('.rds-alert__icon')!.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(sell.querySelector('.rds-alert__icon')!).color).toBe(probe(sell, '--alert-success-foreground'));
    expect(getComputedStyle(sell).backgroundColor).toBe(getComputedStyle(plain).backgroundColor);
    expect(getComputedStyle(sell.querySelector('.rds-alert__title')!).color).toBe(probe(sell, '--alert-neutral-foreground'));
    expect(getComputedStyle(plain.querySelector('.rds-alert__icon')!).color).toBe(probe(plain, '--alert-neutral-foreground'));
  });

  it('iconTone does nothing on a toned Alert: the icon keeps the tone colour', async () => {
    const el = await render(<Alert tone="danger" iconTone="success" title="Falhou" />);
    const alert = el.querySelector<HTMLElement>('.rds-alert')!;
    expect(alert.querySelector('.rds-alert__icon--success')).toBeNull();
    expect(getComputedStyle(alert.querySelector('.rds-alert__icon')!).color).toBe(probe(alert, '--alert-danger-foreground'));
  });

  it('inline: title and description on one line, read as one sentence; it wraps with the words when narrow', async () => {
    const wide = await render(
      <div style={{ width: 560 }}>
        <Alert layout="inline" icon={<Check />} iconTone="success" title="Você já pode vender:" description="PDV, Pix e pedidos no WhatsApp." />
      </div>,
    );
    const title = wide.querySelector<HTMLElement>('.rds-alert__title')!;
    const description = wide.querySelector<HTMLElement>('.rds-alert__description')!;
    expect(Math.round(description.getBoundingClientRect().top)).toBe(Math.round(title.getBoundingClientRect().top));
    expect(description.getBoundingClientRect().left).toBeGreaterThan(title.getBoundingClientRect().right);
    expect(wide.querySelector('.rds-alert__text')!.textContent).toBe('Você já pode vender: PDV, Pix e pedidos no WhatsApp.');

    const narrow = await render(
      <div style={{ width: 240 }}>
        <Alert layout="inline" title="Você já pode vender:" description="PDV, Pix e pedidos no WhatsApp." />
      </div>,
    );
    // The description starts on the title's line and wraps: an inline box spanning two lines or more.
    const text = narrow.querySelector<HTMLElement>('.rds-alert__text')!;
    const d = narrow.querySelector<HTMLElement>('.rds-alert__description')!;
    expect(d.getClientRects().length).toBeGreaterThan(1);
    expect(text.getBoundingClientRect().height).toBeGreaterThan(20);
  });

  it('stacked stays the default: the description under the title', async () => {
    const el = await render(
      <div style={{ width: 560 }}>
        <Alert title="Você já pode vender:" description="PDV, Pix e pedidos no WhatsApp." />
      </div>,
    );
    expect(el.querySelector('.rds-alert--inline')).toBeNull();
    const title = el.querySelector<HTMLElement>('.rds-alert__title')!.getBoundingClientRect();
    const description = el.querySelector<HTMLElement>('.rds-alert__description')!.getBoundingClientRect();
    expect(description.top).toBeGreaterThanOrEqual(title.bottom);
  });
});
