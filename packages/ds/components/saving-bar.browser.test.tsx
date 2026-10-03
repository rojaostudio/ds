import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
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

  it('at 390 (compact): the message on top, at most 2 lines, no word broken; Descartar and Salvar share the width', async () => {
    await page.viewport(390, 800);
    const message = 'Você alterou o preço, o estoque e a descrição de três produtos e ainda não salvou nenhuma dessas alterações';
    const el = await render(
      <div style={{ width: 390 }}>
        <SavingBar message={message} onSave={() => {}} onDiscard={() => {}} />
      </div>,
    );
    const bar = el.querySelector<HTMLElement>('.rds-savingbar')!;
    const row = bar.querySelector<HTMLElement>('.rds-savingbar__row')!;
    expect(getComputedStyle(row).flexDirection).toBe('column');
    const text = bar.querySelector<HTMLElement>('.rds-savingbar__text')!;
    const style = getComputedStyle(text);
    expect(style.webkitLineClamp).toBe('2');
    expect(text.getBoundingClientRect().height).toBeLessThanOrEqual(2 * parseFloat(style.lineHeight) + 0.5);
    expect(['normal', 'keep-all']).toContain(style.wordBreak);
    expect(style.overflowWrap).toBe('normal');
    const [discard, save] = [...bar.querySelectorAll<HTMLElement>('button')];
    const a = discard.getBoundingClientRect();
    const b = save.getBoundingClientRect();
    expect(a.top).toBeGreaterThan(text.getBoundingClientRect().bottom);
    expect(a.top).toBe(b.top);
    expect(Math.abs(a.width - b.width)).toBeLessThan(1);
    // Each label on one line: a button keeps its 44.
    for (const r of [a, b]) expect(r.height).toBe(44);
    expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth);
  });

  it('from 1024 (expanded): one row, the message grows (at least 160) beside the actions', async () => {
    await page.viewport(1280, 800);
    const el = await render(
      <div style={{ width: 1100 }}>
        <SavingBar onSave={() => {}} onDiscard={() => {}} />
      </div>,
    );
    const row = el.querySelector<HTMLElement>('.rds-savingbar__row')!;
    expect(getComputedStyle(row).flexDirection).toBe('row');
    const msg = el.querySelector<HTMLElement>('.rds-savingbar__message')!;
    expect(getComputedStyle(msg).minWidth).toBe('160px');
    expect(getComputedStyle(msg).flexBasis).toBe('160px');
    const actions = el.querySelector<HTMLElement>('.rds-savingbar__actions')!.getBoundingClientRect();
    expect(actions.top).toBeLessThan(msg.getBoundingClientRect().bottom);
  });

  it('compact passes axe in both modes', async () => {
    await page.viewport(390, 800);
    for (const mode of MODES) {
      const el = await render(
        <div style={{ width: 390 }}>
          <SavingBar status="error" onSave={() => {}} onDiscard={() => {}} />
        </div>,
        mode,
      );
      expect(await axeViolations(el)).toEqual([]);
      cleanup();
    }
  });
});
