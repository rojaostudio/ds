import { afterEach, describe, expect, it } from 'vitest';
import { ChoiceCard, ChoiceCardGroup } from './choice-card';
import { Empty } from './empty';
import { RadioGroup } from './radio-group';
import { Radio } from './radio';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';
import { Input } from './input';
import { focusFirstInvalid } from './focus-first-invalid';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// ds#145 and ds#146: the "send it empty" rule for groups and required lists.
const form = (
  <form style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
    <ChoiceCardGroup legend="Forma de pagamento" layout="tile" required errorMessage="Escolha a forma de pagamento">
      <ChoiceCard value="pix">Pix</ChoiceCard>
      <ChoiceCard value="card">Cartão</ChoiceCard>
    </ChoiceCardGroup>
    <ToggleGroup type="single" aria-label="Tamanho" errorMessage="Escolha um tamanho">
      <ToggleGroupItem value="p">P</ToggleGroupItem>
      <ToggleGroupItem value="m">M</ToggleGroupItem>
    </ToggleGroup>
    <RadioGroup legend="Entrega" errorMessage="Escolha a entrega">
      <Radio value="a">Retirada</Radio>
      <Radio value="b">Entrega</Radio>
    </RadioGroup>
    <Empty title="Nenhum item" errorMessage="Adicione pelo menos um item" />
  </form>
);

const desc = (el: Element) =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent)
    .join(' ');

describe.each(MODES)('Error in choice groups and required lists (%s)', (mode) => {
  it('every group in error passes axe', async () => {
    const el = await render(form, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Error in choice groups and required lists', () => {
  it('ties each message to its group and marks it invalid', async () => {
    const el = await render(form);
    const cards = el.querySelector('.rds-choice-card-group')!;
    expect(cards.getAttribute('aria-invalid')).toBe('true');
    expect(desc(cards)).toContain('Escolha a forma de pagamento');
    const toggles = el.querySelector('.rds-toggle-group')!;
    expect(toggles.getAttribute('aria-invalid')).toBe('true');
    expect(desc(toggles)).toContain('Escolha um tamanho');
    const empty = el.querySelector('.rds-empty')!;
    expect(empty.getAttribute('aria-invalid')).toBe('true');
    expect(desc(empty)).toContain('Adicione pelo menos um item');
  });

  it('paints the unchosen cards and the toggles with the error border', async () => {
    const el = await render(form);
    const errorBorder = (sel: string) => getComputedStyle(el.querySelector(sel)!).borderTopColor;
    const reference = document.createElement('span');
    reference.style.color = 'var(--border-error)';
    el.appendChild(reference);
    const red = getComputedStyle(reference).color;
    expect(errorBorder('.rds-choice-card')).toBe(red);
    expect(errorBorder('.rds-toggle')).toBe(red);
  });

  it('a required card group puts required on its radios', async () => {
    const el = await render(form);
    expect(el.querySelector<HTMLInputElement>('.rds-choice-card__input')!.required).toBe(true);
  });

  it('focusFirstInvalid goes to the first invalid group, then to a field before it', async () => {
    const el = await render(form);
    const focused = focusFirstInvalid(el);
    expect(focused).toBe(el.querySelector('.rds-choice-card__input'));
    expect(document.activeElement).toBe(focused);
  });

  it('focusFirstInvalid prefers an earlier invalid field and lands on an Empty when it is the only one', async () => {
    const el = await render(
      <form>
        <Input label="Nome" errorMessage="Informe o nome" />
        <Empty title="Nenhum item" errorMessage="Adicione pelo menos um item" />
      </form>,
    );
    expect(focusFirstInvalid(el)).toBe(el.querySelector('input'));
    const only = await render(<Empty title="Nenhum item" errorMessage="Adicione pelo menos um item" />);
    expect(focusFirstInvalid(only)).toBe(only.querySelector('.rds-empty'));
  });

  it('returns null when nothing is invalid', async () => {
    const el = await render(<Empty title="Nenhum item" />);
    expect(focusFirstInvalid(el)).toBeNull();
    expect(el.querySelector('.rds-empty')!.hasAttribute('tabindex')).toBe(false);
  });
});
