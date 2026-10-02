import { afterEach, describe, expect, it } from 'vitest';
import { Kbd, KbdGroup } from './kbd';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('Kbd (%s)', (mode) => {
  it('a key and a combination pass axe, as nested <kbd>', async () => {
    const el = await render(
      <p>
        Abra a busca com{' '}
        <KbdGroup>
          <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd>
        </KbdGroup>{' '}
        ou <Kbd aria-label="Command">⌘</Kbd>
      </p>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
    expect(el.querySelectorAll('kbd.rds-kbd-group > kbd.rds-kbd')).toHaveLength(2);
    expect(el.querySelector<HTMLElement>('.rds-kbd')!.getBoundingClientRect().height).toBe(20);
  });
});
