import { afterEach, expect, it } from 'vitest';
import { axeViolations, cleanup, render } from './render';

afterEach(cleanup);

// The gate itself: if axe stopped measuring colour, every component test would pass blindly.
it('axe fails low-contrast text', async () => {
  const el = await render(<p style={{ color: '#d4d4d8', background: '#ffffff' }}>Too light</p>);
  expect((await axeViolations(el)).some((v) => v.startsWith('color-contrast'))).toBe(true);
});
