import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { InsightCard, type InsightCardType } from './insight-card';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const TYPES: InsightCardType[] = ['alert', 'opportunity', 'tip'];

describe.each(MODES)('InsightCard (%s)', (mode) => {
  it('every type, with potential and an action (button and link), passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 560 }}>
        {TYPES.map((type) => (
          <InsightCard
            key={type}
            type={type}
            title="Seu produto mais vendido está sem estoque"
            description="Reponha antes do fim de semana: é quando ele mais vende."
            potential="+ R$ 450/mês"
            action="Repor estoque"
            actionOnClick={() => {}}
          />
        ))}
        {TYPES.map((type) => (
          <InsightCard key={`${type}-link`} type={type} title="Dica" description="Sem potencial." action="Ver" actionHref="#ver" />
        ))}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('InsightCard behaviour', () => {
  it('the tag names the type; the action is a button with onClick and a link with href', async () => {
    const onClick = vi.fn();
    const el = await render(
      <div>
        <InsightCard type="opportunity" title="A" description="B" action="Agir" actionOnClick={onClick} />
        <InsightCard type="tip" title="C" description="D" action="Ler" actionHref="#ler" />
      </div>,
    );
    const [first, second] = el.querySelectorAll('.rds-insight-card');
    expect(first.querySelector('.rds-insight-card__badge')!.textContent).toBe('Oportunidade');
    const button = first.querySelector('button')!;
    await act(async () => button.click());
    expect(onClick).toHaveBeenCalledOnce();
    expect(second.querySelector('a')!.getAttribute('href')).toBe('#ler');
    // The visible action is 32 tall; the touch area reaches 44.
    const target = getComputedStyle(button, '::before');
    expect(target.content).not.toBe('none');
  });
});
