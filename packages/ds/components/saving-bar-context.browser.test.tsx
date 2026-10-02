import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { SavingBarProvider, SavingBarRoot, usePageSavingBar } from './saving-bar-context';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

function Section({ message, onSave, onDiscard }: { message: string; onSave?: () => void; onDiscard?: () => void }) {
  const [dirty, setDirty] = useState(true);
  usePageSavingBar(
    {
      visible: dirty,
      message,
      onSave: () => {
        onSave?.();
        setDirty(false);
      },
      onDiscard: () => {
        onDiscard?.();
        setDirty(false);
      },
    },
    [dirty],
  );
  return <p>{message}</p>;
}

describe.each(MODES)('SavingBarRoot (%s)', (mode) => {
  it('one and two registrations pass axe', async () => {
    const el = await render(
      <SavingBarProvider>
        <Section message="Horários alterados" />
        <Section message="Frete alterado" />
        <SavingBarRoot />
      </SavingBarProvider>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('SavingBarRoot behaviour', () => {
  it('fixed across the foot of the page, above the content', async () => {
    const el = await render(
      <SavingBarProvider>
        <Section message="Horários alterados" />
        <SavingBarRoot />
      </SavingBarProvider>,
    );
    const root = el.querySelector<HTMLElement>('.rds-saving-bar-root')!;
    const style = getComputedStyle(root);
    expect(style.position).toBe('fixed');
    expect(style.bottom).toBe('0px');
    expect(Math.round(root.getBoundingClientRect().width)).toBe(window.innerWidth);
    expect(Number(style.zIndex)).toBeGreaterThan(0);
  });

  it('one registration shows its own message; Salvar saves it and the bar goes', async () => {
    const onSave = vi.fn();
    const el = await render(
      <SavingBarProvider>
        <Section message="Horários alterados" onSave={onSave} />
        <SavingBarRoot />
      </SavingBarProvider>,
    );
    expect(el.querySelector('.rds-saving-bar-root [role="status"]')!.textContent).toBe('Horários alterados');
    await userEvent.click([...el.querySelectorAll<HTMLButtonElement>('.rds-saving-bar-root button')].at(-1)!);
    expect(onSave).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(el.querySelector('.rds-saving-bar-root')).toBeNull());
  });

  it('two registrations add up: "2 alterações pendentes", Descartar tudo discards both', async () => {
    const a = vi.fn();
    const b = vi.fn();
    const el = await render(
      <SavingBarProvider>
        <Section message="Horários alterados" onDiscard={a} />
        <Section message="Frete alterado" onDiscard={b} />
        <SavingBarRoot />
      </SavingBarProvider>,
    );
    expect(el.querySelector('.rds-saving-bar-root [role="status"]')!.textContent).toBe('2 alterações pendentes');
    const discard = [...el.querySelectorAll<HTMLButtonElement>('.rds-saving-bar-root button')].find((x) => x.textContent === 'Descartar tudo')!;
    await userEvent.click(discard);
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });
});
