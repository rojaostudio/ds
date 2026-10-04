import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FormActions } from '../form-actions';
import { SavingBar } from '../saving-bar';

// On the server there is no window nor visualViewport: the bars render as they are, never hidden.
describe('the on-screen keyboard on the server', () => {
  it('FormActions bar and stacked render without the keyboard class', () => {
    for (const layout of ['bar', 'stacked'] as const) {
      const html = renderToString(
        <FormActions layout={layout} helper="Falta preço">
          <button type="button">Criar</button>
        </FormActions>,
      );
      expect(html).toContain(`rds-form-actions--${layout}`);
      expect(html).not.toContain('--keyboard');
    }
  });

  it('SavingBar renders without the keyboard class', () => {
    const html = renderToString(<SavingBar onSave={() => {}} />);
    expect(html).toContain('rds-savingbar');
    expect(html).not.toContain('--keyboard');
  });
});
