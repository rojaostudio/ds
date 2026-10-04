import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Switch } from './switch';
import { Card, CardHeader } from './card';
import { MODES, SCHEMES, axeViolations, cleanup, render, renderIn } from './__tests__/render';

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

describe.each(SCHEMES)('Switch size and labelPosition (%s)', (scheme) => {
  it('sm and md, label at the end and at the start, with hint, on and disabled, pass axe', async () => {
    const el = await renderIn(
      <div style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
        {(['md', 'sm'] as const).flatMap((size) =>
          (['end', 'start'] as const).map((labelPosition) => (
            <div key={`${size}-${labelPosition}`} style={{ display: 'grid', gap: 8 }}>
              <Switch size={size} labelPosition={labelPosition} hint="Por notificação no celular.">
                Avisar
              </Switch>
              <Switch size={size} labelPosition={labelPosition} defaultChecked>
                Avisar
              </Switch>
              <Switch size={size} labelPosition={labelPosition} disabled>
                Avisar
              </Switch>
            </div>
          )),
        )}
      </div>,
      scheme,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Switch size', () => {
  it('sm has no padding above and below (24 tall), hugs its content, and keeps a 44 × 44 invisible target', async () => {
    const el = await render(
      <div style={{ width: 360 }}>
        <Switch size="sm">Avisar</Switch>
        <Switch>Avisar</Switch>
      </div>,
    );
    const [sm, md] = el.querySelectorAll<HTMLElement>('.rds-switch');
    expect(sm.querySelector('.rds-choice__row')!.getBoundingClientRect().height).toBe(24);
    expect(getComputedStyle(sm.querySelector('.rds-choice__row')!).paddingTop).toBe('0px');
    const label = sm.querySelector('.rds-choice__label')!.getBoundingClientRect();
    const track = sm.querySelector('.rds-switch__track')!.getBoundingClientRect();
    expect(Math.round(sm.getBoundingClientRect().width)).toBe(Math.round(label.right - track.left));
    expect(md.getBoundingClientRect().width).toBe(360);
    const target = getComputedStyle(sm.querySelector('.rds-switch__control')!, '::before');
    expect(target.position).toBe('absolute');
    expect(target.top).toBe('-10px');
    expect(target.bottom).toBe('-10px');
    // 40 + 2 × 4 = 48 wide, 24 + 2 × 10 = 44 tall.
    expect(target.left).toBe('-4px');
    expect(target.right).toBe('-4px');
  });

  it('a tap on the invisible target above the control toggles the sm Switch', async () => {
    const el = await render(
      <div style={{ padding: 24 }}>
        <Switch size="sm">Avisar</Switch>
      </div>,
    );
    const control = el.querySelector('.rds-switch__control')!.getBoundingClientRect();
    const hit = document.elementFromPoint(control.left + control.width / 2, control.top - 6) as HTMLElement;
    hit.click();
    expect(el.querySelector('input')!.checked).toBe(true);
  });

  it('the Card header takes the sm Switch on its title line', async () => {
    const el = await render(
      <Card>
        <CardHeader title="Avisos" description="Pedidos novos" action={<Switch size="sm" aria-label="Avisos" />} />
      </Card>,
    );
    const band = el.querySelector('.rds-card__action')!.getBoundingClientRect();
    const track = el.querySelector('.rds-switch__track')!.getBoundingClientRect();
    expect(band.height).toBe(24);
    expect(track.top).toBe(band.top);
  });
});

describe('Switch labelPosition', () => {
  it('start: the control at the right edge, the label fills, the hint lines up with the label; DOM and name unchanged', async () => {
    const el = await render(
      <div style={{ width: 360 }}>
        <Switch labelPosition="start" hint="Por notificação no celular.">
          Avisar
        </Switch>
      </div>,
    );
    const root = el.querySelector('.rds-switch')!.getBoundingClientRect();
    const track = el.querySelector('.rds-switch__track')!.getBoundingClientRect();
    const label = el.querySelector('.rds-choice__label')!.getBoundingClientRect();
    const hint = el.querySelector('.rds-switch__hint')!;
    expect(track.right).toBe(root.right);
    expect(label.left).toBe(root.left);
    expect(hint.getBoundingClientRect().left).toBe(label.left);
    expect(getComputedStyle(hint).paddingLeft).toBe('0px');
    // The DOM keeps the control first: the input is the first focusable, named by its label.
    const row = el.querySelector('.rds-choice__row')!;
    expect(row.firstElementChild!.className).toContain('rds-choice__control');
    const input = el.querySelector('input')!;
    expect(input.labels?.[0]?.textContent).toBe('Avisar');
    await userEvent.tab();
    expect(document.activeElement).toBe(input);
  });

  it('start on sm: the control comes right after the text', async () => {
    const el = await render(
      <div style={{ width: 360 }}>
        <Switch size="sm" labelPosition="start">
          Avisar
        </Switch>
      </div>,
    );
    const track = el.querySelector('.rds-switch__track')!.getBoundingClientRect();
    const label = el.querySelector('.rds-choice__label')!.getBoundingClientRect();
    expect(track.left - label.right).toBe(12);
  });
});
