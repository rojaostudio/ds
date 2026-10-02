import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './button';
import { FormActions } from './form-actions';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('FormActions (%s)', (mode) => {
  it('passes axe inline with a helper and stacked', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
        <FormActions helper="Você pode editar depois.">
          <Button tone="action" variant="ghost">Cancelar</Button>
          <Button tone="action">Publicar</Button>
        </FormActions>
        <FormActions layout="stacked">
          <Button tone="action" variant="ghost">Cancelar</Button>
          <Button tone="action">Publicar</Button>
        </FormActions>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('FormActions behaviour', () => {
  it('stacked puts the primary first, in the page and in the focus order', async () => {
    const el = await render(
      <FormActions layout="stacked">
        <Button variant="ghost">Cancelar</Button>
        <Button>Publicar</Button>
      </FormActions>,
    );
    const labels = [...el.querySelectorAll('button')].map((b) => b.textContent);
    expect(labels).toEqual(['Publicar', 'Cancelar']);
  });

  it('inline keeps reading order and shows the helper only when given', async () => {
    const el = await render(
      <FormActions>
        <Button variant="ghost">Cancelar</Button>
        <Button>Publicar</Button>
      </FormActions>,
    );
    const labels = [...el.querySelectorAll('button')].map((b) => b.textContent);
    expect(labels).toEqual(['Cancelar', 'Publicar']);
    expect(el.querySelector('.rds-form-actions__helper')).toBeNull();
  });
});
