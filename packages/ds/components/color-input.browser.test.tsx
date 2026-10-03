import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { ColorInput, normalizeHex } from './color-input';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

const BRAND = ['#2563EB', '#7C3AED', '#DB2777', '#DC2626', '#EA580C', '#CA8A04', '#16A34A', '#0D9488', '#0891B2', '#475569', '#0F172A', '#FFFFFF'];
const hex = (el: HTMLElement) => el.querySelector<HTMLInputElement>('.rds-color-input__hex')!;
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');

describe.each(MODES)('ColorInput (%s)', (mode) => {
  it('every closed state passes axe: with and without palette, hint, error, required, disabled', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 16, maxWidth: 240 }}>
        <ColorInput label="Cor principal" defaultValue="#2563EB" palette={BRAND} />
        <ColorInput label="Cor principal" defaultValue="#2563EB" hint="Usada nos botões e links." required />
        <ColorInput label="Cor principal" defaultValue="#2563EB" errorMessage="Use o formato #RRGGBB." palette={BRAND} />
        <ColorInput label="Cor principal" defaultValue="#2563EB" disabled palette={BRAND} />
        <ColorInput label="Cor principal" defaultValue="#2563EB" disabled />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the open palette passes axe', async () => {
    const el = await render(<ColorInput label="Cor principal" defaultValue="#2563EB" palette={BRAND} />, mode);
    await userEvent.click(el.querySelector<HTMLButtonElement>('.rds-color-input__swatch')!);
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    await settle();
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it('a 44 box with the 28 swatch painted in the chosen colour', async () => {
    const el = await render(<ColorInput label="Cor principal" defaultValue="#2563eb" />, mode);
    expect(el.querySelector<HTMLElement>('.rds-field__box')!.getBoundingClientRect().height).toBe(44);
    const swatch = el.querySelector<HTMLElement>('.rds-color-input__swatch')!;
    expect(swatch.getBoundingClientRect().width).toBe(28);
    expect(getComputedStyle(swatch).backgroundColor).toBe('rgb(37, 99, 235)');
    expect(hex(el).value).toBe('#2563EB');
  });
});

describe('ColorInput behaviour', () => {
  it('the top label on the rojao light theme passes axe', async () => {
    const el = await render(<ColorInput label="Cor principal" />, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the palette title on the rojao light theme passes axe (color-input/palette/title is text/heading)', async () => {
    const el = await render(<ColorInput label="Cor principal" defaultValue="#2563EB" palette={BRAND} />, 'light');
    await userEvent.click(el.querySelector<HTMLButtonElement>('.rds-color-input__swatch')!);
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    await settle();
    expect(await axeViolations(document.body, ['.rds-field__label'])).toEqual([]);
  });

  it('normalises a hex: with or without #, in capitals', () => {
    expect(normalizeHex('2563eb')).toBe('#2563EB');
    expect(normalizeHex(' #2563EB ')).toBe('#2563EB');
    expect(normalizeHex('#2563E')).toBeNull();
    expect(normalizeHex('azul')).toBeNull();
  });

  it('Enter or blur confirms the hex; an invalid one goes back to the last valid', async () => {
    const onChange = vi.fn();
    const el = await render(<ColorInput label="Cor principal" defaultValue="#2563EB" onChange={onChange} />);
    const input = hex(el);
    expect(input.labels?.[0]?.textContent).toBe('Cor principal');
    await userEvent.fill(input, '16a34a');
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('#16A34A');
    expect(input.value).toBe('#16A34A');
    expect(getComputedStyle(el.querySelector('.rds-color-input__swatch')!).backgroundColor).toBe('rgb(22, 163, 74)');
    await userEvent.fill(input, '#16A3');
    input.blur();
    await vi.waitFor(() => expect(input.value).toBe('#16A34A'));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('the swatch opens the palette; choosing a colour closes it, sends it and gives the focus back', async () => {
    const onChange = vi.fn();
    const el = await render(<ColorInput label="Cor principal" defaultValue="#2563EB" palette={BRAND} onChange={onChange} />);
    const swatch = el.querySelector<HTMLButtonElement>('.rds-color-input__swatch')!;
    expect(swatch.getAttribute('aria-label')).toBe('Escolher cor: #2563EB');
    expect(swatch.getAttribute('aria-expanded')).toBe('false');
    swatch.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    expect(dialog()!.getAttribute('aria-label')).toBe('Cores da marca');
    expect(dialog()!.textContent).toContain('Ou digite o hex no campo.');
    const chosen = dialog()!.querySelector('[aria-pressed="true"]')!;
    expect(chosen.getAttribute('aria-label')).toBe('#2563EB');
    await userEvent.click(dialog()!.querySelector<HTMLButtonElement>('[aria-label="#DB2777"]')!);
    await vi.waitFor(() => expect(dialog()).toBeNull());
    expect(onChange).toHaveBeenLastCalledWith('#DB2777');
    expect(hex(el).value).toBe('#DB2777');
    await vi.waitFor(() => expect(document.activeElement).toBe(swatch));
  });

  it('without a palette the swatch is the native colour picker', async () => {
    const onChange = vi.fn();
    const el = await render(<ColorInput label="Cor principal" defaultValue="#2563EB" onChange={onChange} />);
    const native = el.querySelector<HTMLInputElement>('input[type="color"]')!;
    expect(native.getAttribute('aria-label')).toBe('Escolher cor');
    expect(native.value).toBe('#2563eb');
    await userEvent.fill(native, '#ff0000');
    expect(onChange).toHaveBeenLastCalledWith('#FF0000');
  });

  it('hint, error, required and disabled as in the Input; name carries the hex', async () => {
    const el = await render(
      <>
        <ColorInput label="Cor" hint="Usada nos botões e links." required name="cor" defaultValue="#2563EB" />
        <ColorInput label="Cor" errorMessage="Use o formato #RRGGBB." />
        <ColorInput label="Cor" disabled palette={BRAND} />
      </>,
    );
    const [first, wrong, off] = Array.from(el.querySelectorAll<HTMLInputElement>('.rds-color-input__hex'));
    expect(first.required).toBe(true);
    expect(first.name).toBe('cor');
    expect(document.getElementById(first.getAttribute('aria-describedby')!)?.textContent).toBe('Usada nos botões e links.');
    expect(wrong.getAttribute('aria-invalid')).toBe('true');
    expect(off.disabled).toBe(true);
    expect(el.querySelectorAll<HTMLButtonElement>('.rds-color-input__swatch')[2].disabled).toBe(true);
  });

  it('the chosen swatch, the focused one and the field swatch on focus: a focus-ring-width ring as far off (a gap)', async () => {
    const el = await render(<ColorInput label="Cor principal" defaultValue="#2563EB" palette={BRAND} />);
    const swatch = el.querySelector<HTMLButtonElement>('.rds-color-input__swatch')!;
    swatch.focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await userEvent.keyboard('{Tab}');
    const ring = (x: Element) => {
      const cs = getComputedStyle(x);
      return [cs.outlineStyle, cs.outlineWidth, cs.outlineOffset];
    };
    expect(document.activeElement).toBe(swatch);
    expect(ring(swatch)).toEqual(['solid', '2px', '2px']);
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    await settle();
    const chosen = dialog()!.querySelector('[aria-pressed="true"]')!;
    expect(ring(chosen)).toEqual(['solid', '2px', '2px']);
    const other = dialog()!.querySelector<HTMLButtonElement>('[aria-pressed="false"]')!;
    other.focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await userEvent.keyboard('{Tab}');
    expect(ring(document.activeElement!)).toEqual(['solid', '2px', '2px']);
  });
});
