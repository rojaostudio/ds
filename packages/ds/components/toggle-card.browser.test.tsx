import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Input } from './input';
import { ToggleCard } from './toggle-card';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// The Input's top label is text/heading, flare-700 on the rojao light theme: pinned with it.fails in
// input.browser.test.tsx.
const KNOWN_LIGHT = (mode: string) => (mode === 'light' ? ['.rds-field__label'] : []);

function Controlled({ initial = false, onChange }: { initial?: boolean; onChange?: (v: boolean) => void }) {
  const [on, setOn] = useState(initial);
  return (
    <ToggleCard
      label="Entrega"
      description="Cobrar frete por bairro"
      checked={on}
      name="delivery"
      onCheckedChange={(v) => {
        setOn(v);
        onChange?.(v);
      }}
    >
      <Input label="Taxa" />
    </ToggleCard>
  );
}

describe.each(MODES)('ToggleCard (%s)', (mode) => {
  it('off, on with its options, and disabled pass axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
        <Controlled />
        <Controlled initial />
        <ToggleCard label="Retirada" checked={false} onCheckedChange={() => {}} disabled />
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT(mode))).toEqual([]);
  });
});

describe('ToggleCard behaviour', () => {
  it('a Card with a Switch: turning it on shows the options and submits on', async () => {
    const onChange = vi.fn();
    const el = await render(<Controlled onChange={onChange} />);
    expect(el.querySelector('.rds-card')).not.toBeNull();
    const sw = el.querySelector<HTMLInputElement>('input[role="switch"]')!;
    expect(el.querySelector('.rds-toggle-card__content')).toBeNull();
    expect(el.querySelector<HTMLInputElement>('input[type="hidden"][name="delivery"]')!.value).toBe('');
    await userEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(sw.checked).toBe(true);
    expect(el.querySelector('.rds-toggle-card__content')).not.toBeNull();
    expect(el.querySelector<HTMLInputElement>('input[type="hidden"][name="delivery"]')!.value).toBe('on');
  });

  it('the label names the Switch and the description is its hint', async () => {
    const el = await render(<Controlled />);
    const sw = el.querySelector<HTMLInputElement>('input[role="switch"]')!;
    expect(sw.labels?.[0]?.textContent).toContain('Entrega');
    const hint = document.getElementById(sw.getAttribute('aria-describedby')!)!;
    expect(hint.textContent).toBe('Cobrar frete por bairro');
  });
});
