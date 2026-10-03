import { afterEach, describe, expect, it } from 'vitest';
import { act, useState } from 'react';
import { Bubble } from './bubble';
import { Marker } from './marker';
import { Message } from './message';
import { MessageScroller } from './message-scroller';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const messages = (count: number) =>
  Array.from({ length: count }, (_, i) => (
    <Message key={i} align={i % 2 ? 'end' : 'start'}>
      <Bubble variant={i % 2 ? 'fill' : 'soft'} align={i % 2 ? 'end' : 'start'}>
        Mensagem {i + 1}
      </Bubble>
    </Message>
  ));

let add: () => void = () => {};
function Chat({ initial = 12 }: { initial?: number }) {
  const [count, setCount] = useState(initial);
  add = () => setCount((c) => c + 1);
  return (
    <div style={{ height: 240, width: 480 }}>
      <MessageScroller>
        <Marker kind="separator">Hoje</Marker>
        {messages(count)}
      </MessageScroller>
    </div>
  );
}

const viewport = (el: HTMLElement) => el.querySelector<HTMLElement>('.rds-scroller__viewport')!;
const distanceToEnd = (box: HTMLElement) => box.scrollHeight - box.scrollTop - box.clientHeight;
const scrollTo = async (box: HTMLElement, top: number) => {
  await act(async () => {
    box.scrollTop = top;
    box.dispatchEvent(new Event('scroll'));
  });
};

describe.each(MODES)('MessageScroller (%s)', (mode) => {
  it('the conversation, and the button to the end, pass axe', async () => {
    const el = await render(<Chat />, mode);
    expect(await axeViolations(el)).toEqual([]);
    await scrollTo(viewport(el), 0);
    expect(el.querySelector('.rds-scroller__to-end')).not.toBeNull();
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('MessageScroller behaviour', () => {
  it('a named, focusable log, opened at the end', async () => {
    const el = await render(<Chat />);
    const box = viewport(el);
    expect(box.getAttribute('role')).toBe('log');
    expect(box.getAttribute('aria-label')).toBe('Conversa');
    expect(box.tabIndex).toBe(0);
    expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
    expect(distanceToEnd(box)).toBeLessThanOrEqual(1);
    expect(el.querySelector('.rds-scroller__to-end')).toBeNull();
  });

  it('a new message keeps it at the end while the person is there', async () => {
    const el = await render(<Chat />);
    await act(async () => add());
    expect(distanceToEnd(viewport(el))).toBeLessThanOrEqual(1);
  });

  it('scrolled up: a new message does not move it; the button goes back to the end and leaves', async () => {
    const el = await render(<Chat />);
    const box = viewport(el);
    await scrollTo(box, 0);
    await act(async () => add());
    expect(box.scrollTop).toBe(0);
    const button = el.querySelector<HTMLButtonElement>('.rds-scroller__to-end')!;
    expect(button.getAttribute('aria-label')).toBe('Ir para a mensagem mais nova');
    await act(async () => button.click());
    expect(el.querySelector('.rds-scroller__to-end')).toBeNull();
    expect(document.activeElement).toBe(box);
    // A smooth scroll: give it time under a loaded run.
    await expect.poll(() => distanceToEnd(box), { timeout: 5000 }).toBeLessThanOrEqual(1);
    await expect.poll(() => el.querySelector('.rds-scroller__to-end')).toBeNull();
  });
});
