import { afterEach, describe, expect, it } from 'vitest';
import { Checkbox } from './checkbox';
import { CheckboxGroup } from './checkbox-group';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const options = (disabled?: boolean) => (
  <>
    <Checkbox name="canal" value="email" disabled={disabled}>E-mail</Checkbox>
    <Checkbox name="canal" value="sms" defaultChecked disabled={disabled}>SMS</Checkbox>
    <Checkbox name="canal" value="whatsapp" disabled={disabled}>WhatsApp</Checkbox>
  </>
);

describe.each(MODES)('CheckboxGroup (%s)', (mode) => {
  it('every state passes axe: plain, hint, required, error, disabled', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 24, maxWidth: 360 }}>
        <CheckboxGroup legend="Como prefere ser avisado?">{options()}</CheckboxGroup>
        <CheckboxGroup legend="Como prefere ser avisado?" hint="Escolha quantos quiser." required>
          {options()}
        </CheckboxGroup>
        <CheckboxGroup legend="Como prefere ser avisado?" errorMessage="Escolha pelo menos um canal.">
          {options()}
        </CheckboxGroup>
        <CheckboxGroup legend="Como prefere ser avisado?" disabled>
          {options(true)}
        </CheckboxGroup>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('CheckboxGroup behaviour', () => {
  it('the legend on the rojao light theme passes axe', async () => {
    const el = await render(<CheckboxGroup legend="Como prefere ser avisado?">{options()}</CheckboxGroup>, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the legend names the fieldset; hint and error describe it; required is said in words', async () => {
    const el = await render(
      <CheckboxGroup legend="Canais" hint="Escolha quantos quiser." required errorMessage="Escolha pelo menos um canal.">
        {options()}
      </CheckboxGroup>,
    );
    const fieldset = el.querySelector('fieldset')!;
    expect(fieldset.querySelector('legend')!.textContent).toBe('Canais * (obrigatório)');
    const ids = fieldset.getAttribute('aria-describedby')!.split(' ');
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual([
      'Escolha quantos quiser.',
      'Escolha pelo menos um canal.',
    ]);
    // The group's error paints every box red.
    const probe = document.createElement('span');
    probe.style.color = 'var(--checkbox-control-border-error)';
    el.append(probe);
    const box = el.querySelector<HTMLElement>('.rds-checkbox__box')!;
    expect(getComputedStyle(box).borderTopColor).toBe(getComputedStyle(probe).color);
  });

  it('disabled disables every checkbox through the native fieldset', async () => {
    const el = await render(<CheckboxGroup legend="Canais" disabled>{options()}</CheckboxGroup>);
    for (const input of el.querySelectorAll('input')) expect(input.matches(':disabled')).toBe(true);
  });
});
