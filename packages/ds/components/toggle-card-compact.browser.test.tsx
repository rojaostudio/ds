import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ClockIcon } from './internal/icons';
import { ToggleCardCompact } from './toggle-card-compact';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

function Controlled({ initial = false, onEdit }: { initial?: boolean; onEdit?: () => void }) {
  const [on, setOn] = useState(initial);
  return (
    <ToggleCardCompact
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

describe.each(MODES)('ToggleCardCompact (%s)', (mode) => {
  it('off, on with the pencil, and disabled pass axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
        <Controlled />
        <Controlled initial onEdit={() => {}} />
        <ToggleCardCompact label="Fila" checked={false} disabled />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('ToggleCardCompact behaviour', () => {
  it('an outline Item: the description off, the summary and the pencil on', async () => {
    const onEdit = vi.fn();
    const el = await render(<Controlled onEdit={onEdit} />);
    expect(el.querySelector('.rds-item--outline')).not.toBeNull();
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
});
