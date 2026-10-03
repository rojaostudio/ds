import { afterEach, describe, expect, it } from 'vitest';
import { Textarea } from './textarea';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);


describe.each(MODES)('Textarea (%s)', (mode) => {
  it('every state passes axe: empty, filled, hint, error, disabled, required, floating', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
        <Textarea label="Mensagem" />
        <Textarea label="Mensagem" defaultValue="Olá, tudo bem?" />
        <Textarea label="Mensagem" hint="Até 500 caracteres." />
        <Textarea label="Mensagem" errorMessage="Escreva a mensagem antes de enviar." />
        <Textarea label="Mensagem" disabled />
        <Textarea label="Mensagem" disabled defaultValue="Olá" />
        <Textarea label="Mensagem" required />
        <Textarea label="Mensagem" labelPosition="floating" />
        <Textarea label="Mensagem" labelPosition="floating" defaultValue="Olá" />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Textarea behaviour', () => {
  it('the top label (textarea/label/color → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(<Textarea label="Mensagem" />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the label is tied; hint and error are the description; errorMessage sets aria-invalid', async () => {
    const el = await render(
      <>
        <Textarea label="Mensagem" hint="Até 500 caracteres." required />
        <Textarea label="Resumo" errorMessage="Escreva o resumo." />
      </>,
    );
    const [a, b] = Array.from(el.querySelectorAll('textarea'));
    expect(a.labels?.[0]?.textContent).toContain('Mensagem');
    expect(a.required).toBe(true);
    expect(document.getElementById(a.getAttribute('aria-describedby')!)?.textContent).toBe('Até 500 caracteres.');
    expect(b.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(b.getAttribute('aria-describedby')!)?.textContent).toBe('Escreva o resumo.');
  });

  it('shows at least two lines', async () => {
    const el = await render(<Textarea label="Mensagem" rows={1} />);
    expect(el.querySelector('textarea')!.rows).toBe(2);
    // 12 + 2 × 24 + 12, plus the 1px border on each side.
    expect(el.querySelector('.rds-field__box')!.getBoundingClientRect().height).toBeGreaterThanOrEqual(74);
  });
});
