import { afterEach, describe, expect, it } from 'vitest';
import { FieldGroup, FieldGroupSeparator } from './field-group';
import { focusFirstInvalid } from './focus-first-invalid';
import { Input } from './input';
import { Select, SelectItem } from './select';
import { MODES, axeViolations, cleanup, cssVar, render } from './__tests__/render';

afterEach(cleanup);

const r0 = (e: Element) => e.getBoundingClientRect();
const centre = (e: Element) => r0(e).top + r0(e).height / 2;
const describedTexts = (control: Element) =>
  (control.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent);

/** "Tamanho: largura × altura", the issue's example: two narrow fields, one legend, one error. */
function Size(props: Partial<Parameters<typeof FieldGroup>[0]> & { widthError?: boolean; heightError?: boolean }) {
  const { widthError, heightError, ...group } = props;
  return (
    <FieldGroup legend="Tamanho (largura × altura)" style={{ width: 264 }} {...group}>
      <Input aria-label="Largura" defaultValue="120" error={widthError} errorMessage={widthError ? 'Largura inválida' : undefined} />
      <FieldGroupSeparator />
      <Input aria-label="Altura" defaultValue="80" error={heightError} />
    </FieldGroup>
  );
}

describe.each(MODES)('FieldGroup (%s)', (mode) => {
  it('every state passes axe: plain, hint, required, error', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 24 }}>
        <Size />
        <Size hint="Em centímetros." required />
        <Size errorMessage="Informe a largura e a altura." />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('FieldGroup behaviour', () => {
  it('a fieldset named by its legend; the separator is not read', async () => {
    const el = await render(<Size required />);
    const fieldset = el.querySelector('fieldset')!;
    expect(fieldset.classList.contains('rds-field-group')).toBe(true);
    expect(fieldset.querySelector('legend')!.textContent).toBe('Tamanho (largura × altura) *');
    const sep = fieldset.querySelector('.rds-field-group__separator')!;
    expect(sep.getAttribute('aria-hidden')).toBe('true');
    expect(sep.textContent).toBe('×');
  });

  it('the legend looks like a field label: 14/20 medium, 8 above the boxes', async () => {
    const el = await render(
      <div>
        <Size />
        <Input label="Nome" />
      </div>,
    );
    const legend = el.querySelector('legend')!;
    const label = el.querySelector('label')!;
    for (const prop of ['color', 'fontSize', 'lineHeight', 'fontWeight'] as const) {
      expect(getComputedStyle(legend)[prop]).toBe(getComputedStyle(label)[prop]);
    }
    const box = el.querySelector('.rds-field-group .rds-field__box')!;
    expect(Math.round(r0(box).top - r0(legend).bottom + 4)).toBe(8);
    const ownBox = el.querySelector('label + .rds-field__box')!;
    expect(Math.round(r0(ownBox).top - r0(label).top)).toBe(Math.round(r0(box).top - r0(legend).top));
  });

  it('the fields share the width, 8 apart, and the separator sits on the boxes centre', async () => {
    const el = await render(<Size />);
    const [a, b] = el.querySelectorAll<HTMLElement>('.rds-field-group .rds-field');
    const sep = el.querySelector('.rds-field-group__separator')!;
    expect(Math.abs(r0(a).width - r0(b).width)).toBeLessThanOrEqual(1);
    expect(Math.round(r0(sep).left - r0(a).right)).toBe(8);
    expect(Math.round(r0(b).left - r0(sep).right)).toBe(8);
    expect(Math.round(r0(b).right - r0(a).left)).toBe(264);
    const box = a.querySelector('.rds-field__box')!;
    expect(Math.abs(centre(sep) - centre(box))).toBeLessThanOrEqual(1);
    expect(getComputedStyle(sep).color).toBe(getComputedStyle(a.querySelector('input')!).color);
  });

  it('the group error: every box red with aria-invalid, no message of their own, one message under the set', async () => {
    const el = await render(<Size errorMessage="Informe a largura e a altura." />);
    const inputs = [...el.querySelectorAll('input')];
    expect(inputs.map((i) => i.getAttribute('aria-invalid'))).toEqual(['true', 'true']);
    expect(el.querySelectorAll('.rds-field-group .rds-field--error')).toHaveLength(2);
    const messages = el.querySelectorAll('.rds-field__error-message');
    expect(messages).toHaveLength(1);
    const message = messages[0] as HTMLElement;
    expect(message.parentElement).toBe(el.querySelector('fieldset'));
    expect(r0(message).top).toBeGreaterThanOrEqual(r0(el.querySelector('.rds-field-group__fields')!).bottom);
    for (const input of inputs) expect(describedTexts(input)).toEqual(['Informe a largura e a altura.']);
    // The message reads the field's error colour.
    const probe = document.createElement('span');
    probe.style.color = 'var(--input-error-message-color)';
    el.append(probe);
    expect(getComputedStyle(message).color).toBe(getComputedStyle(probe).color);
  });

  it('error={false} keeps a field out of the group error, and it is not described by the message', async () => {
    const el = await render(
      <FieldGroup legend="Tamanho" errorMessage="A altura passa do máximo.">
        <Input aria-label="Largura" error={false} />
        <FieldGroupSeparator />
        <Input aria-label="Altura" />
      </FieldGroup>,
    );
    const [w, h] = el.querySelectorAll('input');
    expect(w.hasAttribute('aria-invalid')).toBe(false);
    expect(w.hasAttribute('aria-describedby')).toBe(false);
    expect(h.getAttribute('aria-invalid')).toBe('true');
    expect(describedTexts(h)).toEqual(['A altura passa do máximo.']);
  });

  it('a field in error inside a plain group shows only its border: its own message is not drawn, the separator stays centred', async () => {
    const el = await render(<Size widthError />);
    const [w, h] = el.querySelectorAll('input');
    expect(w.getAttribute('aria-invalid')).toBe('true');
    expect(h.hasAttribute('aria-invalid')).toBe(false);
    expect(el.querySelectorAll('.rds-field__error-message')).toHaveLength(0);
    const boxes = el.querySelectorAll('.rds-field__box');
    const sep = el.querySelector('.rds-field-group__separator')!;
    expect(Math.abs(centre(sep) - centre(boxes[0]))).toBeLessThanOrEqual(1);
    expect(r0(boxes[0]).height).toBe(r0(boxes[1]).height);
  });

  it('the hint goes under the legend and describes every field', async () => {
    const el = await render(<Size hint="Em centímetros." />);
    const hint = el.querySelector('.rds-field__hint')!;
    expect(r0(hint).top).toBeGreaterThanOrEqual(r0(el.querySelector('legend')!).bottom - 1);
    expect(r0(hint).bottom).toBeLessThanOrEqual(r0(el.querySelector('.rds-field-group__fields')!).top);
    for (const input of el.querySelectorAll('input')) expect(describedTexts(input)).toEqual(['Em centímetros.']);
  });

  it('works with other fields: a Select takes the group error too', async () => {
    const el = await render(
      <FieldGroup legend="Telefone" errorMessage="Informe o telefone.">
        <Select aria-label="DDD">
          <SelectItem value="41">41</SelectItem>
        </Select>
        <Input aria-label="Número" />
      </FieldGroup>,
    );
    const controls = el.querySelectorAll('[aria-invalid="true"]');
    expect(controls).toHaveLength(2);
    expect(el.querySelectorAll('.rds-field__error-message')).toHaveLength(1);
  });

  it('focusFirstInvalid lands on the first field in error of the group', async () => {
    const el = await render(
      <form>
        <Input label="Nome" defaultValue="Caixa" />
        <Size heightError />
      </form>,
    );
    expect(focusFirstInvalid(el)).toBe(el.querySelector('input[aria-label="Altura"]'));
    const whole = await render(
      <form>
        <Size errorMessage="Informe a largura e a altura." />
      </form>,
    );
    expect(focusFirstInvalid(whole)).toBe(whole.querySelector('input[aria-label="Largura"]'));
  });

  it('the separator takes another sign', async () => {
    const el = await render(
      <FieldGroup legend="Período">
        <Input aria-label="De" />
        <FieldGroupSeparator>–</FieldGroupSeparator>
        <Input aria-label="Até" />
      </FieldGroup>,
    );
    expect(el.querySelector('.rds-field-group__separator')!.textContent).toBe('–');
    expect(cssVar('--input-value-default')).not.toBe('');
  });
});
