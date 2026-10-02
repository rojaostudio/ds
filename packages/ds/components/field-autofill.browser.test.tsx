import { afterEach, expect, it } from 'vitest';
import { Input } from './input';
import { cleanup, render } from './__tests__/render';

afterEach(cleanup);

// Autofill cannot be triggered from a test; check that the rule covering it ships with the field styles.
it('the field styles cover the browser autofill background with the box colour', async () => {
  await render(<Input label="E-mail" />);
  const rules = [...document.styleSheets].flatMap((s) => {
    try {
      return [...s.cssRules];
    } catch {
      return [];
    }
  });
  const text = rules.map((r) => r.cssText).join('\n');
  expect(text).toMatch(/rds-field__control:(-webkit-)?autofill/);
  expect(text).toMatch(/inset/);
});
