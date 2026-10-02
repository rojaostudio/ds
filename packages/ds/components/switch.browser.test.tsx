import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Switch } from './switch';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('Switch (%s)', (mode) => {
  it('every state passes axe: off, on, hint, disabled off and on, without visible label', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
        <Switch>Notificações</Switch>
        <Switch defaultChecked>Notificações</Switch>
        <Switch hint="Avisamos quando chegar uma resposta.">Notificações</Switch>
        <Switch disabled>Notificações</Switch>
        <Switch disabled defaultChecked>Notificações</Switch>
        <Switch aria-label="Ativar a regra" />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the row is 44px tall and the track 40 × 24', async () => {
    const el = await render(<Switch>Notificações</Switch>, mode);
    expect(el.querySelector('.rds-choice__row')!.getBoundingClientRect().height).toBe(44);
    const track = el.querySelector('.rds-switch__track')!.getBoundingClientRect();
    expect([track.width, track.height]).toEqual([40, 24]);
  });
});

describe('Switch behaviour', () => {
  it('is a switch tied to its label; Space turns it on and off', async () => {
    const onCheckedChange = vi.fn();
    const el = await render(
      <Switch hint="Avisamos quando chegar uma resposta." onCheckedChange={onCheckedChange}>
        Notificações
      </Switch>,
    );
    const input = el.querySelector('input')!;
    expect(input.getAttribute('role')).toBe('switch');
    expect(input.labels?.[0]?.textContent).toBe('Notificações');
    expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe(
      'Avisamos quando chegar uma resposta.',
    );
    input.focus();
    await userEvent.keyboard(' ');
    expect(input.checked).toBe(true);
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    await userEvent.keyboard(' ');
    expect(input.checked).toBe(false);
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it('disabled is the native one', async () => {
    const el = await render(<Switch disabled>Notificações</Switch>);
    expect(el.querySelector('input')!.disabled).toBe(true);
  });
});
