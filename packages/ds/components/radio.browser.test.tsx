import { afterEach, describe, expect, it } from 'vitest';
import { Radio } from './radio';
import { RadioGroup } from './radio-group';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('Radio (%s)', (mode) => {
  it('every state passes axe: unchecked, checked, hint, disabled, in a group in error', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 24, maxWidth: 360 }}>
        <RadioGroup legend="Plano" defaultValue="mensal">
          <Radio value="mensal">Mensal</Radio>
          <Radio value="anual" hint="Dois meses grátis.">Anual</Radio>
          <Radio value="vitalicio" disabled>Vitalício</Radio>
        </RadioGroup>
        <RadioGroup legend="Plano" defaultValue="anual" disabled>
          <Radio value="mensal">Mensal</Radio>
          <Radio value="anual">Anual</Radio>
        </RadioGroup>
        <RadioGroup legend="Plano" errorMessage="Escolha um plano.">
          <Radio value="mensal">Mensal</Radio>
          <Radio value="anual">Anual</Radio>
        </RadioGroup>
        <RadioGroup legend="Linha">
          <Radio value="1" aria-label="Linha 1" />
        </RadioGroup>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the row is 44px tall (the touch minimum)', async () => {
    const el = await render(
      <RadioGroup legend="Plano">
        <Radio value="mensal">Mensal</Radio>
      </RadioGroup>,
      mode,
    );
    expect(el.querySelector('.rds-choice__row')!.getBoundingClientRect().height).toBe(44);
  });
});

describe('Radio behaviour', () => {
  it('the label is tied, the hint describes it, and the group gives the name', async () => {
    const el = await render(
      <RadioGroup legend="Plano" name="plano">
        <Radio value="anual" hint="Dois meses grátis.">Anual</Radio>
      </RadioGroup>,
    );
    const input = el.querySelector('input')!;
    expect(input.labels?.[0]?.textContent).toBe('Anual');
    expect(input.name).toBe('plano');
    expect(input.value).toBe('anual');
    expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe('Dois meses grátis.');
  });
});
