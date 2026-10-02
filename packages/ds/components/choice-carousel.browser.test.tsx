import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { ChoiceCarousel } from './choice-carousel';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

type Plan = { id: string; name: string };
const PLANS: Plan[] = ['Básico', 'Essencial', 'Pro', 'Rede', 'Franquia', 'Enterprise'].map((name) => ({ id: name.toLowerCase(), name }));

function Single({ initial = null }: { initial?: Plan | null }) {
  const [value, setValue] = useState<Plan | null>(initial);
  return (
    <ChoiceCarousel<Plan>
      ariaLabel="Plano"
      options={PLANS}
      getKey={(p) => p.id}
      value={value}
      onChange={(v) => setValue(v as Plan)}
      isDisabled={(p) => p.id === 'enterprise'}
      renderCard={(p, selected) => <span style={{ display: 'block', padding: 16, border: '1px solid' }}>{selected ? `${p.name} ✓` : p.name}</span>}
    />
  );
}

function Multiple() {
  const [value, setValue] = useState<Plan[]>([]);
  return (
    <ChoiceCarousel<Plan>
      multiple
      ariaLabel="Planos"
      options={PLANS.slice(0, 3)}
      getKey={(p) => p.id}
      value={value}
      onChange={(v) => setValue(v as Plan[])}
      renderCard={(p) => <span>{p.name}</span>}
    />
  );
}

describe.each(MODES)('ChoiceCarousel (%s)', (mode) => {
  it('single and multiple pass axe, with the arrows in view', async () => {
    await page.viewport(1024, 768);
    const el = await render(
      <div style={{ display: 'grid', gap: 24, maxWidth: 480, padding: '0 24px' }}>
        <Single initial={PLANS[1]} />
        <Multiple />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('ChoiceCarousel behaviour', () => {
  it('a radiogroup: clicking or Space picks one; a disabled option does not', async () => {
    const el = await render(<Single />);
    const group = el.querySelector('[role="radiogroup"]')!;
    expect(group.getAttribute('aria-label')).toBe('Plano');
    const radios = [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
    await userEvent.click(radios[2]);
    expect(radios[2].getAttribute('aria-checked')).toBe('true');
    radios[0].focus();
    await userEvent.keyboard(' ');
    expect(radios[0].getAttribute('aria-checked')).toBe('true');
    expect(radios[2].getAttribute('aria-checked')).toBe('false');
    expect(radios[5].getAttribute('aria-disabled')).toBe('true');
    radios[5].click();
    expect(radios[5].getAttribute('aria-checked')).toBe('false');
  });

  it('multiple: checkboxes that turn on and off on their own', async () => {
    const el = await render(<Multiple />);
    const boxes = [...el.querySelectorAll<HTMLElement>('[role="checkbox"]')];
    await userEvent.click(boxes[0]);
    await userEvent.click(boxes[1]);
    await userEvent.click(boxes[0]);
    expect(boxes.map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
  });

  it('from 768 the arrows show and scroll the row; the previous one is off at the start', async () => {
    await page.viewport(1024, 768);
    const el = await render(
      <div style={{ maxWidth: 400, padding: '0 24px' }}>
        <Single />
      </div>,
    );
    const [prev, next] = el.querySelectorAll<HTMLElement>('.rds-choice-carousel__arrow');
    expect(getComputedStyle(next).display).not.toBe('none');
    expect(prev.getAttribute('aria-disabled')).toBe('true');
    const track = el.querySelector<HTMLElement>('.rds-choice-carousel__track')!;
    track.style.scrollBehavior = 'auto';
    next.click();
    await expect.poll(() => track.scrollLeft).toBeGreaterThan(0);
  });

  it('below 768 the arrows are gone; the arrow keys scroll the row', async () => {
    await page.viewport(390, 800);
    const el = await render(<Single />);
    for (const arrow of el.querySelectorAll('.rds-choice-carousel__arrow')) expect(getComputedStyle(arrow).display).toBe('none');
    const track = el.querySelector<HTMLElement>('.rds-choice-carousel__track')!;
    track.style.scrollBehavior = 'auto';
    track.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(() => track.scrollLeft).toBeGreaterThan(0);
  });
});
