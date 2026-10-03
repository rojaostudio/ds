import { afterEach, describe, expect, it } from 'vitest';
import { ToggleCardCompact } from './toggle-card-compact';
import { cleanup, render } from './__tests__/render';

afterEach(cleanup);

// ToggleCardCompact is deprecated: a wrapper over ToggleCard layout="compact", tested with axe in
// toggle-card.browser.test.tsx. Here only that the wrapper renders that row.
describe('ToggleCardCompact (deprecated)', () => {
  it('renders the ToggleCard compact row', async () => {
    const el = await render(<ToggleCardCompact label="Horário" description="Sempre aberto" checked={false} name="hours" />);
    expect(el.querySelector('.rds-item--outline.rds-toggle-card--compact')).not.toBeNull();
    expect(el.querySelector('.rds-item__description')!.textContent).toBe('Sempre aberto');
    expect(el.querySelector('input[role="switch"]')!.getAttribute('aria-label')).toBe('Horário');
    expect(el.querySelector<HTMLInputElement>('input[type="hidden"][name="hours"]')!.value).toBe('');
  });
});
