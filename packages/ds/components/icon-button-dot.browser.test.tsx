import { afterEach, describe, expect, it } from 'vitest';
import { IconButton } from './icon-button';
import { InfoIcon } from './internal/icons';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// ds#139: IconButton dot.

describe('IconButton dot', () => {
  it('draws an 8 dot in the corner, decorative; the label says the number', async () => {
    const el = await render(<IconButton icon={<InfoIcon />} label="Serviços fora da tabela, 22" dot="neutral" variant="outline" tone="neutral" />);
    const btn = el.querySelector<HTMLElement>('button')!;
    const dot = btn.querySelector<HTMLElement>('.rds-button__dot')!;
    expect(dot.getAttribute('aria-hidden')).toBe('true');
    const d = dot.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    expect([d.width, d.height]).toEqual([8, 8]);
    expect(d.right).toBeGreaterThan(b.right);
    expect(d.top).toBeLessThan(b.top);
    expect(btn.getAttribute('aria-label')).toBe('Serviços fora da tabela, 22');
  });

  it('with a count, the count wins', async () => {
    const el = await render(<IconButton icon={<InfoIcon />} label="Avisos" dot="info" count={3} />);
    expect(el.querySelector('.rds-button__dot')).toBeNull();
    expect(el.querySelector('.rds-button__count')).not.toBeNull();
  });

  it.each(MODES)('passes axe in every tone (%s)', async (mode) => {
    const el = await render(
      <div style={{ display: 'flex', gap: 16 }}>
        {(['neutral', 'info', 'danger'] as const).map((t) => (
          <IconButton key={t} icon={<InfoIcon />} label={`Aviso ${t}`} dot={t} variant="outline" tone="neutral" />
        ))}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});
