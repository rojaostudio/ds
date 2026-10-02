import { afterEach, describe, expect, it } from 'vitest';
import { Item } from './item';
import { SettingRow } from './setting-row';
import { SettingsList } from './settings-list';
import { Switch } from './switch';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// pageheader/title and item/title are text/heading, flare-700 on the rojao light theme: pinned with it.fails in
// page-header.browser.test.tsx and item.browser.test.tsx.
const KNOWN_LIGHT = (mode: string) => (mode === 'light' ? ['.rds-page-header__title', '.rds-item__title'] : []);

function Example({ framed }: { framed?: boolean }) {
  return (
    <SettingsList title="Notificações" description="Como avisamos você" framed={framed}>
      <SettingRow label="E-mail" description="Novos pedidos" htmlFor={`email-${framed}`} control={<Switch id={`email-${framed}`} />} />
      <Item title="WhatsApp" action={<Switch aria-label="WhatsApp" />} />
    </SettingsList>
  );
}

describe.each(MODES)('SettingsList (%s)', (mode) => {
  it('framed and loose pass axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 24, maxWidth: 480 }}>
        <Example />
        <Example framed={false} />
      </div>,
      mode,
    );
    expect(await axeViolations(el, KNOWN_LIGHT(mode))).toEqual([]);
  });
});

describe('SettingsList behaviour', () => {
  it('a section titled by an h2 PageHeader; framed in a Card; a line between rows only', async () => {
    const el = await render(<Example framed />);
    expect(el.querySelector('section h2')!.textContent).toBe('Notificações');
    expect(el.querySelector('.rds-settings-list .rds-card')).not.toBeNull();
    const [first, second] = el.querySelector('.rds-settings-list__rows')!.children;
    expect(getComputedStyle(first).borderTopWidth).toBe('0px');
    expect(getComputedStyle(second).borderTopWidth).toBe('1px');
  });

  it('framed={false} leaves the rows loose; without a title there is no header', async () => {
    const el = await render(
      <SettingsList framed={false}>
        <Item title="Um" />
      </SettingsList>,
    );
    expect(el.querySelector('.rds-card')).toBeNull();
    expect(el.querySelector('h2')).toBeNull();
  });
});
