import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { userEvent } from 'vitest/browser';
import { Checkbox } from './checkbox';
import { ChoiceCard } from './choice-card';
import { Input } from './input';
import { Questionnaire } from './questionnaire';
import { Radio } from './radio';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// [RDS] maps questionnaire/title to text/heading, flare on the rojao light theme (2.9:1 on white): a violation of
// the Figma itself, pinned with it.fails below. The neutral ghost Buttons (Voltar, Pular) and the Input's label read
// text/heading too, as in button.browser.test.tsx and input.browser.test.tsx.
const KNOWN_LIGHT = (mode: string) =>
  mode === 'light' ? ['.rds-questionnaire__title', '.rds-questionnaire__actions .rds-button--neutral', '.rds-field__label'] : [];

const where = (props: Partial<Parameters<typeof Questionnaire>[0]> = {}) => (
  <Questionnaire
    step={2}
    steps={4}
    title="Onde você quer receber?"
    description="Escolha uma. Dá para mudar depois."
    onBack={() => {}}
    onSkip={() => {}}
    onNext={() => {}}
    {...props}
  >
    <Radio value="sp">São Paulo</Radio>
    <Radio value="rj">Rio de Janeiro</Radio>
    <Radio value="retirada">Retirar na loja</Radio>
  </Questionnaire>
);

describe.each(MODES)('Questionnaire (%s)', (mode) => {
  it('single, with and without the error, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16 }}>
        {where()}
        {where({ title: 'Qual cidade?', error: 'Escolha uma opção para seguir.' })}
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT(mode))).toEqual([]);
  });

  it('multiple, card and text pass axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16 }}>
        <Questionnaire step={1} steps={3} title="O que você procura?" answer="multiple" onNext={() => {}}>
          <Checkbox value="moveis">Móveis</Checkbox>
          <Checkbox value="decoracao">Decoração</Checkbox>
        </Questionnaire>
        <Questionnaire step={2} steps={3} title="Qual turno de entrega?" answer="card" error="Escolha um turno." onNext={() => {}}>
          <ChoiceCard value="manha">Manhã</ChoiceCard>
          <ChoiceCard value="noite">Noite</ChoiceCard>
        </Questionnaire>
        <Questionnaire step={3} steps={3} title="Qual é o seu nome?" answer="text" onNext={() => {}}>
          <Input label="Nome" />
        </Questionnaire>
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT(mode))).toEqual([]);
  });
});

describe('Questionnaire behaviour', () => {
  it.fails('the question (questionnaire/title → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(where(), 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('a form named by the question; the options are a radiogroup named by it too; the progress says the step', async () => {
    const el = await render(where());
    const form = el.querySelector('form')!;
    expect(form.getAttribute('aria-label')).toBe('Onde você quer receber?');
    const group = el.querySelector('[role="radiogroup"]')!;
    expect(group.querySelector('legend')!.textContent).toContain('Onde você quer receber?');
    const bar = el.querySelector('[role="progressbar"]')!;
    expect(bar.getAttribute('aria-valuenow')).toBe('2');
    expect(bar.getAttribute('aria-valuemax')).toBe('4');
    expect(el.querySelector('.rds-progress__label')!.textContent).toBe('Pergunta 2 de 4');
  });

  it('next submits; Enter in a field too; the last step says Enviar; back and skip only with their handlers', async () => {
    const onNext = vi.fn();
    const onBack = vi.fn();
    const el = await render(where({ onNext, onBack, onSkip: undefined }));
    const labels = [...el.querySelectorAll('button')].map((b) => b.textContent);
    expect(labels).toEqual(['Voltar', 'Próxima']);
    await act(async () => el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
    expect(onNext).toHaveBeenCalledTimes(1);
    await act(async () => el.querySelectorAll<HTMLButtonElement>('button')[0].click());
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);

    const last = await render(
      <Questionnaire step={3} steps={3} title="Qual é o seu nome?" answer="text" onNext={onNext}>
        <Input label="Nome" />
      </Questionnaire>,
    );
    expect(last.querySelector('button[type="submit"]')!.textContent).toBe('Enviar');
    last.querySelector('input')!.focus();
    await userEvent.keyboard('Ana{Enter}');
    expect(onNext).toHaveBeenCalledTimes(2);
  });

  it('the error is tied to the options (single) or announced (card, text)', async () => {
    const el = await render(
      <div>
        {where({ error: 'Escolha uma opção para seguir.' })}
        <Questionnaire step={1} steps={2} title="Qual é o seu nome?" answer="text" error="Diga o seu nome." onNext={() => {}}>
          <Input label="Nome" />
        </Questionnaire>
      </div>,
    );
    const group = el.querySelector('[role="radiogroup"]')!;
    expect(group.getAttribute('aria-invalid')).toBe('true');
    const described = group.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)!.textContent);
    expect(described).toContain('Escolha uma opção para seguir.');
    expect(el.querySelector('[role="alert"]')!.textContent).toBe('Diga o seu nome.');
  });
});
