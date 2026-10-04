import { afterEach, describe, expect, it } from 'vitest';
import { Item } from './item';
import { SettingsList } from './settings-list';
import { Switch } from './switch';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

function Example({ framed }: { framed?: boolean }) {
  return (
    <SettingsList title="Notificações" description="Como avisamos você" framed={framed}>
      <Item title="E-mail" description="Novos pedidos" action={<Switch aria-label="E-mail" />} />
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
    expect(await axeViolations(el)).toEqual([]);
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
