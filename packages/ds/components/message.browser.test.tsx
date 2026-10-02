import { afterEach, describe, expect, it } from 'vitest';
import { Avatar } from './avatar';
import { Bubble } from './bubble';
import { IconButton } from './icon-button';
import { CheckIcon, PlusIcon } from './internal/icons';
import { Message } from './message';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

// [RDS] maps message/name to text/heading, flare on the rojao light theme (2.9:1 on white): a violation of the Figma
// itself, pinned with it.fails below.
const KNOWN_LIGHT_NAME = (mode: string) => (mode === 'light' ? ['.rds-message__name'] : []);

const conversation = (
  <div style={{ width: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Message
      name="Assistente"
      time="14:32"
      dateTime="2026-10-01T14:32"
      avatar={<Avatar type="brand" />}
      footer={
        <>
          <IconButton icon={<CheckIcon />} label="Copiar" tone="neutral" variant="ghost" />
          <IconButton icon={<PlusIcon />} label="Tentar de novo" tone="neutral" variant="ghost" />
        </>
      }
    >
      <Bubble>Achei 3 mesas de jantar perto de você.</Bubble>
    </Message>
    <Message align="end" time="14:33" avatar={<Avatar name="Ana Souza" />}>
      <Bubble variant="fill" align="end">
        Quero ver as de madeira.
      </Bubble>
    </Message>
    <Message>
      <Bubble>Sem cabeçalho nem avatar, na sequência.</Bubble>
    </Message>
  </div>
);

describe.each(MODES)('Message (%s)', (mode) => {
  it('start and end, with and without header, avatar and footer, pass axe', async () => {
    const el = await render(conversation, mode);
    expect(await axeViolations(el, KNOWN_LIGHT_NAME(mode))).toEqual([]);
  });
});

describe('Message behaviour', () => {
  it.fails('the name (message/name → text/heading) passes axe on the rojao light theme', async () => {
    const el = await render(conversation, 'light');
    expect(await axeViolations(el)).toEqual([]);
  });

  it('an article with the name and a machine-readable time; the header goes when both are left out', async () => {
    const el = await render(conversation);
    const [first, second, third] = el.querySelectorAll('article.rds-message');
    expect(first.querySelector('.rds-message__name')!.textContent).toBe('Assistente');
    expect(first.querySelector('time')!.getAttribute('datetime')).toBe('2026-10-01T14:32');
    expect(second.querySelector('.rds-message__name')).toBeNull();
    expect(third.querySelector('.rds-message__header')).toBeNull();
    expect(first.querySelectorAll('.rds-message__footer button')).toHaveLength(2);
  });

  it('end mirrors: the avatar on the right, the content aligned right', async () => {
    const el = await render(conversation);
    const end = el.querySelectorAll<HTMLElement>('.rds-message')[1];
    const avatar = end.querySelector('.rds-message__avatar')!.getBoundingClientRect();
    const bubble = end.querySelector('.rds-bubble')!.getBoundingClientRect();
    expect(avatar.left).toBeGreaterThan(bubble.right);
    expect(avatar.left - bubble.right).toBe(8);
  });
});
