import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { IconButton } from './icon-button';
import { Tooltip, type TooltipSide } from './tooltip';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

const Trash = () => (
  <svg viewBox="0 0 24 24">
    <path d="M3 6h18" />
  </svg>
);
// The balloon is portalled to the body, outside the test's <main>: the page-level landmark rule (region) does not
// apply to a floating layer; every other rule runs on the whole page.
const outsideRegion = (lines: string[]) => lines.filter((line) => !line.startsWith('region:'));
const tip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

describe.each(MODES)('Tooltip (%s)', (mode) => {
  it.each(['top', 'bottom', 'left', 'right'] as TooltipSide[])('open on side %s passes axe', async (side) => {
    const el = await render(
      <div style={{ padding: 64 }}>
        <Tooltip text="Excluir" side={side} delay={0}>
          <IconButton icon={<Trash />} label="Excluir lista" tone="neutral" variant="ghost" />
        </Tooltip>
      </div>,
      mode,
    );
    el.querySelector('button')!.focus();
    await vi.waitFor(() => expect(tip()).not.toBeNull());
    await settle();
    expect(outsideRegion(await axeViolations(document.body))).toEqual([]);
  });
});

describe('Tooltip behaviour', () => {
  it('opens on keyboard focus with aria-describedby on the focusable control itself (#11), and Escape closes', async () => {
    const el = await render(
      <div style={{ padding: 64 }}>
        <Tooltip text="Excluir">
          <IconButton icon={<Trash />} label="Excluir lista" tone="neutral" variant="ghost" />
        </Tooltip>
      </div>,
    );
    const button = el.querySelector('button')!;
    expect(button.getAttribute('aria-describedby')).toBeNull();
    await userEvent.tab();
    expect(document.activeElement).toBe(button);
    await vi.waitFor(() => expect(tip()).not.toBeNull());
    const describedBy = button.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe('Excluir');
    // No wrapper: the button's parent is the page's own element.
    expect(button.parentElement?.getAttribute('aria-describedby')).toBeNull();
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(tip()).toBeNull());
    expect(document.activeElement).toBe(button);
  });

  it('opens on hover and closes when the mouse leaves', async () => {
    const el = await render(
      <div style={{ padding: 64 }}>
        <Tooltip text="Excluir" delay={0}>
          <IconButton icon={<Trash />} label="Excluir lista" tone="neutral" variant="ghost" />
        </Tooltip>
        <p style={{ marginTop: 96 }}>Fora</p>
        <p>Mais longe</p>
      </div>,
    );
    const [away, further] = el.querySelectorAll('p');
    await userEvent.hover(away);
    await userEvent.hover(el.querySelector('button')!);
    await vi.waitFor(() => expect(tip()).not.toBeNull());
    // Radix keeps it open across the grace area toward the balloon: two moves away, below it, close it.
    await userEvent.hover(away);
    await userEvent.hover(further);
    await vi.waitFor(() => expect(tip()).toBeNull());
  });
});
