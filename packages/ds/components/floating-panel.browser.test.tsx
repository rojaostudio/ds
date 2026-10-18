import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { page, userEvent } from 'vitest/browser';
import { Avatar } from './avatar';
import { Bubble } from './bubble';
import { Button } from './button';
import { Composer } from './composer';
import { FloatingPanel } from './floating-panel';
import { Message } from './message';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

const panel = () => document.querySelector<HTMLElement>('.rds-floating-panel');
const visible = (el: Element | null) => !!el && getComputedStyle(el).display !== 'none';

function Example() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Falar com a gente</Button>
      <input aria-label="Busca da página" />
      <FloatingPanel
        open={open}
        onOpenChange={setOpen}
        title="Atendimento"
        status="Online agora"
        avatar={<Avatar type="brand" />}
        footer={<Composer onSend={() => {}} />}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <Message key={i} time="14:32">
            <Bubble>Mensagem {i + 1}</Bubble>
          </Message>
        ))}
      </FloatingPanel>
    </>
  );
}

const open = async () => {
  const el = await render(<Example />);
  await userEvent.click(el.querySelector('button')!);
  await settle();
  return el;
};

describe.each(MODES)('FloatingPanel (%s)', (mode) => {
  beforeEach(() => page.viewport(1280, 800));

  it('open passes axe', async () => {
    const el = await render(<Example />, mode);
    await userEvent.click(el.querySelector('button')!);
    await settle();
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe('FloatingPanel behaviour, from lg', () => {
  beforeEach(() => page.viewport(1280, 800));

  it('a non-modal dialog named by the title and described by the status', async () => {
    await open();
    const box = panel()!;
    expect(box.getAttribute('role')).toBe('dialog');
    expect(box.getAttribute('aria-modal')).toBe('false');
    expect(document.getElementById(box.getAttribute('aria-labelledby')!)!.textContent).toBe('Atendimento');
    expect(document.getElementById(box.getAttribute('aria-describedby')!)!.textContent).toBe('Online agora');
    expect(document.querySelector('.rds-floating-panel ~ [data-state], .rds-modal__scrim')).toBeNull();
  });

  it('400 × 640 at the bottom right, 24 from the edges; only the body scrolls', async () => {
    await open();
    const r = panel()!.getBoundingClientRect();
    expect([r.width, r.height]).toEqual([400, 640]);
    expect(window.innerWidth - r.right).toBe(24);
    expect(window.innerHeight - r.bottom).toBe(24);
    const body = panel()!.querySelector<HTMLElement>('.rds-floating-panel__body')!;
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    expect(getComputedStyle(body).overflowY).toBe('auto');
    expect(visible(panel()!.querySelector('.rds-floating-panel__close'))).toBe(true);
    expect(visible(panel()!.querySelector('.rds-floating-panel__back'))).toBe(false);
  });

  it('never taller than the screen less 96', async () => {
    await page.viewport(1280, 600);
    await open();
    expect(panel()!.getBoundingClientRect().height).toBe(600 - 96);
  });

  it('opens on the Composer; the page still takes focus and clicks, and it stays open', async () => {
    const el = await open();
    expect(document.activeElement).toBe(panel()!.querySelector('textarea'));
    const outside = el.querySelector<HTMLInputElement>('input')!;
    await userEvent.click(outside);
    expect(document.activeElement).toBe(outside);
    expect(panel()).not.toBeNull();
  });

  it('Esc closes and the focus goes back to what opened it', async () => {
    const el = await open();
    await userEvent.keyboard('{Escape}');
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(el.querySelector('button'));
  });

  it('the close button closes', async () => {
    await open();
    await userEvent.click(panel()!.querySelector<HTMLButtonElement>('.rds-floating-panel__close')!);
    expect(panel()).toBeNull();
  });
});

describe('FloatingPanel behaviour, compact', () => {
  beforeEach(() => page.viewport(390, 844));
  afterEach(() => page.viewport(1280, 800));

  it('fills the screen, square, with back in place of close', async () => {
    await open();
    const r = panel()!.getBoundingClientRect();
    expect([r.left, r.top, r.width, r.height]).toEqual([0, 0, 390, 844]);
    expect(getComputedStyle(panel()!).borderTopLeftRadius).toBe('0px');
    expect(visible(panel()!.querySelector('.rds-floating-panel__back'))).toBe(true);
    expect(visible(panel()!.querySelector('.rds-floating-panel__close'))).toBe(false);
    await userEvent.click(panel()!.querySelector<HTMLButtonElement>('.rds-floating-panel__back')!);
    expect(panel()).toBeNull();
  });
});
