import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { Button } from './button';
import { Combobox } from './combobox';
import { Input } from './input';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(async () => {
  cleanup();
  await page.viewport(1280, 800);
});

// ds#153: a shortcut shown as keys and set as aria-keyshortcuts.
const ui = (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
    <Button shortcut="F2">Finalizar</Button>
    <Button variant="outline" shortcut="Control+Enter">Salvar</Button>
    <Input label="Buscar" shortcut="/" />
    <Combobox label="Cliente" options={['Ana', 'Bia']} shortcut="Control+K" />
  </div>
);

describe.each(MODES)('Shortcut keys (%s)', (mode) => {
  it('passes axe', async () => {
    const el = await render(ui, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Shortcut keys', () => {
  it('sets aria-keyshortcuts and draws the keys, hidden from the screen reader', async () => {
    const el = await render(ui);
    const [finish, save] = el.querySelectorAll('button.rds-button');
    expect(finish.getAttribute('aria-keyshortcuts')).toBe('F2');
    expect([...finish.querySelectorAll('kbd')].map((k) => k.textContent)).toEqual(['F2']);
    expect(save.querySelector('.rds-button__shortcut')!.getAttribute('aria-hidden')).toBe('true');
    expect(save.querySelector('.rds-kbd-group')!.textContent).toBe('Ctrl+Enter');
    expect(el.querySelector('input[aria-keyshortcuts="/"]')).not.toBeNull();
    expect(el.querySelector('input[aria-keyshortcuts="Control+K"]')).not.toBeNull();
    expect(el.querySelectorAll('.rds-field__shortcut')).toHaveLength(2);
  });

  it('hides the keys on a compact screen and keeps aria-keyshortcuts', async () => {
    await page.viewport(390, 844);
    const el = await render(ui);
    for (const keys of el.querySelectorAll<HTMLElement>('.rds-button__shortcut, .rds-field__shortcut')) {
      expect(getComputedStyle(keys).display).toBe('none');
    }
    expect(el.querySelector('button')!.getAttribute('aria-keyshortcuts')).toBe('F2');
  });
});
