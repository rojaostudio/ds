import { afterEach, describe, expect, it, vi } from 'vitest';
import { SavingBar, type SavingBarStatus } from './saving-bar';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const STATUSES: SavingBarStatus[] = ['unsaved', 'saving', 'error'];

describe.each(MODES)('SavingBar (%s)', (mode) => {
  it('every status passes axe', async () => {
    const el = await render(
      <div style={{ display: 'grid', gap: 8 }}>
        {STATUSES.map((status) => (
          <SavingBar key={status} status={status} aria-label={`Salvar (${status})`} onSave={() => {}} onDiscard={() => {}} />
        ))}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('SavingBar behaviour', () => {
  it('unsaved: message, Descartar and Salvar', async () => {
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    const el = await render(<SavingBar onSave={onSave} onDiscard={onDiscard} />);
    expect(el.querySelector('[role="status"]')!.textContent).toBe('Alterações não salvas');
    const [discard, save] = el.querySelectorAll('button');
    expect([discard.textContent, save.textContent]).toEqual(['Descartar', 'Salvar']);
    discard.click();
    save.click();
    expect(onDiscard).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('without onDiscard there is no Descartar (showDiscard off)', async () => {
    const el = await render(<SavingBar onSave={() => {}} />);
    expect([...el.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Salvar']);
  });

  it('saving: says Salvando… and the buttons stay focusable but ignore clicks', async () => {
    const onSave = vi.fn();
    const el = await render(<SavingBar status="saving" onSave={onSave} onDiscard={() => {}} />);
    expect(el.querySelector('[role="status"]')!.textContent).toBe('Salvando…');
    for (const b of el.querySelectorAll('button')) expect(b.getAttribute('aria-disabled')).toBe('true');
    const save = [...el.querySelectorAll('button')].at(-1)!;
    save.focus();
    expect(document.activeElement).toBe(save);
    save.click();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('error: the error text and Tentar de novo', async () => {
    const onSave = vi.fn();
    const el = await render(<SavingBar status="error" onSave={onSave} />);
    expect(el.querySelector('[role="status"]')!.textContent).toBe('Não salvou. Tente de novo.');
    const retry = el.querySelector('button')!;
    expect(retry.textContent).toBe('Tentar de novo');
    retry.click();
    expect(onSave).toHaveBeenCalledOnce();
  });
});
