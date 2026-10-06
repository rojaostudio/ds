import { afterEach, describe, expect, it } from 'vitest';
import { Marker, type MarkerKind } from './marker';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const KINDS: MarkerKind[] = ['inline', 'border', 'separator'];

describe.each(MODES)('Marker (%s)', (mode) => {
  it('every kind, and the status in progress, passes axe', async () => {
    const el = await render(
      <div style={{ width: 400 }}>
        {KINDS.map((kind) => (
          <Marker key={kind} kind={kind}>
            Buscando produtos parecidos…
          </Marker>
        ))}
        <Marker loading>Buscando produtos parecidos…</Marker>
        <Marker icon={null}>Nota do sistema</Marker>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Marker behaviour', () => {
  it('loading puts a Spinner in place of the icon and announces the text', async () => {
    const el = await render(
      <div>
        <Marker>Pronto</Marker>
        <Marker loading>Buscando…</Marker>
      </div>,
    );
    const [idle, busy] = el.querySelectorAll('.rds-marker');
    expect(idle.hasAttribute('role')).toBe(false);
    expect(busy.getAttribute('role')).toBe('status');
    expect(busy.querySelector('.rds-marker__icon .rds-spinner')).not.toBeNull();
    expect(busy.querySelector('.rds-marker__icon')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('separator puts the text between two decorative lines, without the icon', async () => {
    const el = await render(
      <div style={{ width: 400 }}>
        <Marker kind="separator">Hoje</Marker>
      </div>,
    );
    const marker = el.querySelector('.rds-marker')!;
    const lines = marker.querySelectorAll('.rds-marker__line');
    expect(lines).toHaveLength(2);
    expect([...lines].every((l) => l.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(marker.querySelector('svg')).toBeNull();
    expect(lines[0].getBoundingClientRect().height).toBe(1);
  });

  it('border draws the line under it', async () => {
    const el = await render(<Marker kind="border">Nota</Marker>);
    expect(getComputedStyle(el.querySelector('.rds-marker')!).borderBottomWidth).toBe('1px');
  });
});

