import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Composer } from './composer';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const field = () => document.querySelector<HTMLTextAreaElement>('.rds-composer__field')!;
const send = () => document.querySelector<HTMLButtonElement>('.rds-composer__send')!;

describe.each(MODES)('Composer (%s)', (mode) => {
  it('empty, filled, sending and disabled pass axe', async () => {
    const el = await render(
      <div style={{ width: 368, display: 'grid', gap: 16 }}>
        <Composer onSend={() => {}} />
        <Composer onSend={() => {}} defaultValue="Pode entregar amanhã de manhã?" />
        <Composer onSend={() => {}} defaultValue="Pode entregar amanhã de manhã?" sending />
        <Composer onSend={() => {}} disabled />
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Composer behaviour', () => {
  it('a named field and a send button, off while the text is empty', async () => {
    await render(<Composer onSend={() => {}} />);
    expect(field().getAttribute('aria-label')).toBe('Mensagem');
    expect(send().getAttribute('aria-label')).toBe('Enviar');
    expect(send().getAttribute('aria-disabled')).toBe('true');
  });

  it('Enter sends the trimmed text and empties the field; Shift+Enter breaks the line', async () => {
    const onSend = vi.fn();
    await render(<Composer onSend={onSend} />);
    await userEvent.click(field());
    await userEvent.keyboard('  Oi{Shift>}{Enter}{/Shift}tudo bem?  ');
    expect(field().value).toBe('  Oi\ntudo bem?  ');
    expect(onSend).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    expect(onSend).toHaveBeenCalledWith('Oi\ntudo bem?');
    expect(field().value).toBe('');
  });

  it('never sends an empty text, nor while sending', async () => {
    const onSend = vi.fn();
    await render(<Composer onSend={onSend} defaultValue="Oi" sending />);
    await userEvent.click(field());
    await userEvent.keyboard('{Enter}');
    expect(onSend).not.toHaveBeenCalled();
    expect(send().getAttribute('aria-busy')).toBe('true');
    expect(field().value).toBe('Oi');
  });

  it('the send button sends', async () => {
    const onSend = vi.fn();
    await render(<Composer onSend={onSend} defaultValue="Oi" />);
    await userEvent.click(send());
    expect(onSend).toHaveBeenCalledWith('Oi');
  });

  it('one line as tall as the button (48 inside the border), grows to 4 lines, then scrolls', async () => {
    await render(
      <div style={{ width: 368 }}>
        <Composer onSend={() => {}} />
      </div>,
    );
    const box = document.querySelector<HTMLElement>('.rds-composer')!;
    expect(box.getBoundingClientRect().height).toBe(50);
    await userEvent.click(field());
    await userEvent.keyboard('1{Shift>}{Enter}{/Shift}2{Shift>}{Enter}{/Shift}3{Shift>}{Enter}{/Shift}4');
    expect(field().getBoundingClientRect().height).toBe(96 + 8);
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}5{Shift>}{Enter}{/Shift}6');
    expect(field().getBoundingClientRect().height).toBe(96 + 8);
    expect(getComputedStyle(field()).overflowY).toBe('auto');
    expect(send().getBoundingClientRect().bottom).toBe(box.getBoundingClientRect().bottom - 1 - 8);
  });
});
