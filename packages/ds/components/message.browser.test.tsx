import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { userEvent } from 'vitest/browser';
import { Avatar } from './avatar';
import { Bubble } from './bubble';
import { IconButton } from './icon-button';
import { CheckIcon, PlusIcon } from './internal/icons';
import { Message } from './message';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

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
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Message behaviour', () => {
  it('the name (message/name → text/heading) passes axe on the rojao light theme', async () => {
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

// ds#179: the delivery of the person's own message.
function Delivery({ status, onRetry }: { status: 'sending' | 'sent' | 'failed'; onRetry?: () => void }) {
  return (
    <div style={{ width: 400 }}>
      <Message align="end" time="14:33" status={status} onRetry={onRetry}>
        <Bubble variant="fill" align="end">
          Quero ver as de madeira.
        </Bubble>
      </Message>
    </div>
  );
}

describe.each(MODES)('Message status (%s)', (mode) => {
  it.each(['sending', 'sent', 'failed'] as const)('%s passes axe', async (status) => {
    const el = await render(<Delivery status={status} onRetry={() => {}} />, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Message status behaviour', () => {
  const region = (el: HTMLElement) => el.querySelector<HTMLElement>('.rds-message [role="status"].rds-visually-hidden')!;

  it('sending: the Spinner and the label in place of the time, the article busy', async () => {
    const el = await render(<Delivery status="sending" />);
    const header = el.querySelector('.rds-message__header')!;
    expect(header.querySelector('time')).toBeNull();
    expect(header.querySelector('.rds-spinner')).not.toBeNull();
    expect(header.textContent).toBe('Enviando');
    expect(el.querySelector('article')!.getAttribute('aria-busy')).toBe('true');
    expect(region(el).textContent).toBe('Enviando');
  });

  it('sent: the time again, and the change said once by the same live region', async () => {
    function Flow() {
      const [status, setStatus] = useState<'sending' | 'sent'>('sending');
      return (
        <>
          <button type="button" onClick={() => setStatus('sent')}>
            chegou
          </button>
          <Delivery status={status} />
        </>
      );
    }
    const el = await render(<Flow />);
    const before = region(el);
    await userEvent.click(el.querySelector('button')!);
    expect(region(el)).toBe(before);
    expect(region(el).textContent).toBe('Enviada');
    expect(el.querySelector('.rds-message__header time')!.textContent).toBe('14:33');
    expect(el.querySelector('article')!.hasAttribute('aria-busy')).toBe(false);
  });

  it('failed: the Bubble in the error colours, the label and "Tentar de novo" calling onRetry', async () => {
    const onRetry = vi.fn();
    const el = await render(<Delivery status="failed" onRetry={onRetry} />);
    const bubble = el.querySelector<HTMLElement>('.rds-bubble')!;
    const probe = document.createElement('span');
    probe.style.background = 'var(--bubble-error-background)';
    el.append(probe);
    expect(getComputedStyle(bubble).backgroundColor).toBe(getComputedStyle(probe).backgroundColor);
    expect(el.querySelector('.rds-message__failed')!.textContent).toContain('Não enviada');
    expect(region(el).textContent).toBe('Não enviada');
    await userEvent.click(el.querySelector<HTMLButtonElement>('.rds-message__failed button')!);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('a start message ignores the status', async () => {
    const el = await render(
      <Message time="14:32" status="sending">
        <Bubble>Achei 3 mesas.</Bubble>
      </Message>,
    );
    expect(el.querySelector('.rds-spinner')).toBeNull();
    expect(el.querySelector('[role="status"].rds-visually-hidden')).toBeNull();
  });
});
