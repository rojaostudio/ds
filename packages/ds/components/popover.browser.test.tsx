import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Button } from './button';
import { Popover, PopoverClose } from './popover';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

const box = () => document.querySelector<HTMLElement>('.rds-popover');

function Example() {
  return (
    <Popover trigger={<Button variant="outline">Ver detalhes</Button>} title="Como o alcance é calculado">
      <p>Pessoas únicas que receberam a campanha nos últimos 30 dias.</p>
      <PopoverClose asChild>
        <Button>Entendi</Button>
      </PopoverClose>
    </Popover>
  );
}

describe.each(MODES)('Popover (%s)', (mode) => {
  it('open, with a title, passes axe', async () => {
    const el = await render(<Example />, mode);
    el.querySelector('button')!.click();
    await vi.waitFor(() => expect(box()).not.toBeNull());
    await settle();
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe('Popover behaviour', () => {
  it('the title on the rojao light theme passes axe', async () => {
    const el = await render(<Example />, 'light');
    el.querySelector('button')!.click();
    await vi.waitFor(() => expect(box()).not.toBeNull());
    await settle();
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it('opens on click, is named by its title, and closes on Escape giving the focus back', async () => {
    const el = await render(<Example />);
    const trigger = el.querySelector('button')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(box()).not.toBeNull());
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(box()!.id);
    expect(document.getElementById(box()!.getAttribute('aria-labelledby')!)?.textContent).toBe('Como o alcance é calculado');
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(box()).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('PopoverClose closes it', async () => {
    const el = await render(<Example />);
    el.querySelector('button')!.click();
    await vi.waitFor(() => expect(box()).not.toBeNull());
    [...box()!.querySelectorAll('button')].find((b) => b.textContent === 'Entendi')!.click();
    await vi.waitFor(() => expect(box()).toBeNull());
  });
});
