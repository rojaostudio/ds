import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FormActions } from '../form-actions';
import { SavingBar } from '../saving-bar';

// On the server there is no window nor visualViewport: the bars render as they are, never hidden.
describe('the on-screen keyboard on the server', () => {
  it('FormActions renders on the shell, docked and floating, without the keyboard class', () => {
    for (const placement of ['docked', 'floating'] as const) {
      const html = renderToString(
        <FormActions placement={placement}>
          <button type="button">Criar</button>
        </FormActions>,
      );
      expect(html).toContain('rds-bottom-bar');
      expect(html).toContain(`rds-bottom-bar--${placement}`);
      expect(html).not.toContain('--keyboard');
    }
  });

  it('SavingBar renders on the shell without the keyboard class', () => {
    const html = renderToString(<SavingBar onSave={() => {}} />);
    expect(html).toContain('rds-savingbar');
    expect(html).toContain('rds-bottom-bar');
    expect(html).not.toContain('--keyboard');
  });
});
