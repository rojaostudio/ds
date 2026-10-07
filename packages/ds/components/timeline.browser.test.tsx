import { afterEach, describe, expect, it } from 'vitest';
import { Avatar } from './avatar';
import { Timeline, TimelineDay, TimelineItem } from './timeline';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

function Example() {
  return (
    <div style={{ width: 400 }}>
      <Timeline aria-label="Histórico do pedido 1042">
        <TimelineDay label="Hoje">
          <TimelineItem
            avatar={<Avatar name="Ana Souza" size="sm" />}
            actor="Ana"
            action="mudou o status"
            time="14:32"
            dateTime="2026-10-07T14:32"
            diff="Aberto → Em produção"
          />
          <TimelineItem actor="Sistema" action="registrou um pagamento de R$ 200,00" time="11:05" dateTime="2026-10-07T11:05" />
        </TimelineDay>
        <TimelineDay label="06/10">
          <TimelineItem actor="Bruno" action="criou o pedido" time="09:40" dateTime="2026-10-06T09:40" />
        </TimelineDay>
      </Timeline>
    </div>
  );
}

describe.each(MODES)('Timeline (%s)', (mode) => {
  it('passes axe', async () => {
    const el = await render(<Example />, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Timeline behaviour', () => {
  it('a named region; each day an <ol> named by its label; each time a <time> with dateTime', async () => {
    const el = await render(<Example />);
    const region = el.querySelector('[role="region"]')!;
    expect(region.getAttribute('aria-label')).toBe('Histórico do pedido 1042');
    const lists = [...region.querySelectorAll('ol')];
    expect(lists).toHaveLength(2);
    expect(document.getElementById(lists[0].getAttribute('aria-labelledby')!)!.textContent).toBe('Hoje');
    expect(lists[0].querySelectorAll(':scope > li')).toHaveLength(2);
    const time = lists[0].querySelector('time')!;
    expect([time.getAttribute('datetime'), time.textContent]).toEqual(['2026-10-07T14:32', '14:32']);
    expect(lists[0].querySelector('.rds-timeline__body')!.textContent).toBe('Ana mudou o status14:32Aberto → Em produção');
  });

  it('the line runs from the avatar to the next item, and not after the last of the day', async () => {
    const el = await render(<Example />);
    const [first, last] = [...el.querySelectorAll<HTMLElement>('ol')[0].querySelectorAll<HTMLElement>('li')];
    const line = first.querySelector<HTMLElement>('.rds-timeline__line')!;
    const r = line.getBoundingClientRect();
    expect(r.width).toBe(1);
    expect(Math.round(r.bottom)).toBe(Math.round(first.getBoundingClientRect().bottom));
    expect(getComputedStyle(last.querySelector('.rds-timeline__line')!).visibility).toBe('hidden');
    expect(first.querySelector('.rds-timeline__rail')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('the actor is medium in the heading colour; the time and the change are muted', async () => {
    const el = await render(<Example />);
    const li = el.querySelector('li')!;
    const actor = getComputedStyle(li.querySelector('.rds-timeline__actor')!);
    const action = getComputedStyle(li.querySelector('.rds-timeline__action')!);
    const time = getComputedStyle(li.querySelector('time')!);
    expect(actor.fontWeight).toBe('500');
    expect(actor.color).not.toBe(action.color);
    expect([time.fontSize, time.lineHeight]).toEqual(['12px', '16px']);
    expect(getComputedStyle(li.querySelector('.rds-timeline__diff')!).color).toBe(time.color);
  });
});
