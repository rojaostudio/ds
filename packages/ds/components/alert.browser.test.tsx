import { afterEach, describe, expect, it, vi } from 'vitest';
import { Alert, type AlertTone } from './alert';
import { Button } from './button';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const TONES: AlertTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

// The action is the neutral ghost Button, whose label the [RDS] maps to text/heading: on the rojao light theme
// that is flare-700 (2.9:1). Kept out of the light matrix and pinned below, as in button.browser.test.tsx.
const KNOWN_LIGHT_ACTION = (mode: string) => (mode === 'light' ? ['.rds-alert__action .rds-button'] : []);

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
            action={<Button tone="neutral" variant="ghost">Tornar visível</Button>}
            onClose={() => {}}
          />
        ))}
        {TONES.map((tone) => (
          <Alert key={`${tone}-plain`} tone={tone} title="Seu perfil está oculto" showIcon={false} />
        ))}
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT_ACTION(mode))).toEqual([]);
  });
});

describe('Alert behaviour', () => {
  it.fails('the neutral ghost action on the rojao light theme passes axe (text/heading is flare-700)', async () => {
    const el = await render(
      <Alert title="Seu perfil está oculto" action={<Button tone="neutral" variant="ghost">Tornar visível</Button>} />,
      'light',
    );
    expect(await axeViolations(el)).toEqual([]);
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
