import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Input } from './input';
import { ClockIcon } from './internal/icons';
import { ToggleCard } from './toggle-card';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// No known violation left since the Rojão heading went navy (labels, item title and neutral Buttons pass).
const KNOWN_COMPACT_LIGHT = (_mode: string): string[] => [];
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
    expect(await axeViolations(el)).toEqual([]);
  });
});

function Compact({ initial = false, onEdit }: { initial?: boolean; onEdit?: () => void }) {
  const [on, setOn] = useState(initial);
  return (
    <ToggleCard
      layout="compact"
      icon={<ClockIcon />}
      label="Horário"
      description="Sempre aberto"
      summary="Seg a sex, 9h às 18h"
      checked={on}
      onCheckedChange={setOn}
      onEdit={onEdit}
      name="hours"
    />
  );
}

describe.each(MODES)('ToggleCard layout="compact" (%s)', (mode) => {
  it('off, on with the pencil, and disabled pass axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
        <Compact />
        <Compact initial onEdit={() => {}} />
        <ToggleCard layout="compact" label="Fila" checked={false} disabled />
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_COMPACT_LIGHT(mode))).toEqual([]);
  });
});

describe('ToggleCard behaviour', () => {
  it('compact is an outline Item, no Card: the description off, the summary and the pencil on', async () => {
    const onEdit = vi.fn();
    const el = await render(<Compact onEdit={onEdit} />);
    expect(el.querySelector('.rds-item--outline.rds-toggle-card--compact')).not.toBeNull();
    expect(el.querySelector('.rds-card')).toBeNull();
    expect(el.querySelector('.rds-item__description')!.textContent).toBe('Sempre aberto');
    expect(el.querySelector('[aria-label="Editar"]')).toBeNull();
    const sw = el.querySelector<HTMLInputElement>('input[role="switch"]')!;
    expect(sw.getAttribute('aria-label')).toBe('Horário');
    await userEvent.click(sw);
    expect(el.querySelector('.rds-item__description')!.textContent).toBe('Seg a sex, 9h às 18h');
    expect(el.querySelector<HTMLInputElement>('input[type="hidden"][name="hours"]')!.value).toBe('on');
    el.querySelector<HTMLButtonElement>('[aria-label="Editar"]')!.click();
    expect(onEdit).toHaveBeenCalledOnce();
  });

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
