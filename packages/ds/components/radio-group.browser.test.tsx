import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { userEvent } from 'vitest/browser';
import { Radio } from './radio';
import { RadioGroup } from './radio-group';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// The [RDS] maps radiogroup/legend/color to text/heading, and the rojao light heading is flare-700 (#ff6a00,
// 2.9:1 on white) for a 16px legend. Kept out of the light axe matrix and pinned below until the Figma decides.
const KNOWN_LIGHT_LEGEND = (mode: string) => (mode === 'light' ? ['.rds-radio-group__legend'] : []);

const plans = () => [
  <Radio key="m" value="mensal">Mensal</Radio>,
  <Radio key="a" value="anual">Anual</Radio>,
  <Radio key="v" value="vitalicio">Vitalício</Radio>,
];

describe.each(MODES)('RadioGroup (%s)', (mode) => {
  it('every state passes axe: plain, hint, required, error, disabled', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 24, maxWidth: 360 }}>
        <RadioGroup legend="Plano">{plans()}</RadioGroup>
        <RadioGroup legend="Plano" hint="Você pode trocar depois." required defaultValue="anual">
          {plans()}
        </RadioGroup>
        <RadioGroup legend="Plano" errorMessage="Escolha um plano para continuar.">
          {plans()}
        </RadioGroup>
        <RadioGroup legend="Plano" disabled defaultValue="mensal">
          {plans()}
        </RadioGroup>
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT_LEGEND(mode))).toEqual([]);
  });
});

describe('RadioGroup behaviour', () => {
  it.fails('the legend on the rojao light theme passes axe (text/heading is flare-700)', async () => {
    const el = await render(<RadioGroup legend="Plano">{plans()}</RadioGroup>, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('is a radiogroup named by the legend; required, invalid, hint and error reach it', async () => {
    const el = await render(
      <RadioGroup legend="Plano" hint="Você pode trocar depois." required errorMessage="Escolha um plano.">
        {plans()}
      </RadioGroup>,
    );
    const group = el.querySelector('fieldset')!;
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('aria-required')).toBe('true');
    expect(group.getAttribute('aria-invalid')).toBe('true');
    const ids = group.getAttribute('aria-describedby')!.split(' ');
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual(['Você pode trocar depois.', 'Escolha um plano.']);
    // One native required is enough for the browser to ask for a choice.
    const radios = Array.from(el.querySelectorAll('input'));
    expect(radios.map((r) => r.required)).toEqual([true, false, false]);
    expect(new Set(radios.map((r) => r.name)).size).toBe(1);
  });

  it('the arrow keys move and choose, uncontrolled', async () => {
    const onValueChange = vi.fn();
    const el = await render(
      <RadioGroup legend="Plano" defaultValue="mensal" onValueChange={onValueChange}>
        {plans()}
      </RadioGroup>,
    );
    const [mensal, anual, vitalicio] = Array.from(el.querySelectorAll('input'));
    expect(mensal.checked).toBe(true);
    mensal.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(anual);
    expect(anual.checked).toBe(true);
    expect(onValueChange).toHaveBeenLastCalledWith('anual');
    await userEvent.keyboard('{ArrowRight}');
    expect(vitalicio.checked).toBe(true);
    await userEvent.keyboard('{ArrowUp}');
    expect(anual.checked).toBe(true);
  });

  it('controlled: the value follows the state', async () => {
    function Controlled() {
      const [value, setValue] = useState('anual');
      return (
        <>
          <RadioGroup legend="Plano" value={value} onValueChange={setValue}>
            {plans()}
          </RadioGroup>
          <output>{value}</output>
        </>
      );
    }
    const el = await render(<Controlled />);
    const [, anual, vitalicio] = Array.from(el.querySelectorAll('input'));
    expect(anual.checked).toBe(true);
    anual.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(vitalicio.checked).toBe(true);
    expect(el.querySelector('output')!.textContent).toBe('vitalicio');
  });
});
