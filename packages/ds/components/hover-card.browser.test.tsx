import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { HoverCard } from './hover-card';
import { MODES, axeViolations, cleanup, render, settle } from './__tests__/render';

afterEach(cleanup);

// The trigger takes Radix's ref and handlers through asChild, so it spreads its props (React 19: ref is a prop).
const Link = (props: React.ComponentPropsWithRef<'a'>) => (
  <a {...props} href="#rojao" style={{ color: 'inherit' }}>
    Rojão Studio
  </a>
);

// The card is portalled to the body, outside the test's <main>: the page-level landmark rule (region) does not
// apply to a floating layer; every other rule runs on the whole page.
const outsideRegion = (lines: string[]) => lines.filter((line) => !line.startsWith('region:'));
const card = () => document.querySelector<HTMLElement>('.rds-hover-card');
const Avatar = () => (
  <span style={{ width: 48, height: 48, borderRadius: 9999, background: 'currentColor', display: 'block' }} />
);

describe.each(MODES)('HoverCard (%s)', (mode) => {
  it('open, with avatar, description and meta, passes axe', async () => {
    await render(
      <HoverCard
        defaultOpen
        title="Rojão Studio"
        description="Estúdio de design e tecnologia. 12 projetos ativos."
        avatar={<Avatar />}
        meta="São Paulo, SP"
      >
        <Link />
      </HoverCard>,
      mode,
    );
    await vi.waitFor(() => expect(card()).not.toBeNull());
    await settle();
    expect(outsideRegion(await axeViolations(document.body))).toEqual([]);
  });
});

describe('HoverCard behaviour', () => {
  it('the title on the rojao light theme passes axe', async () => {
    await render(
      <HoverCard defaultOpen title="Rojão Studio">
        <Link />
      </HoverCard>,
      'light',
    );
    await vi.waitFor(() => expect(card()).not.toBeNull());
    await settle();
    expect(outsideRegion(await axeViolations(document.body))).toEqual([]);
  });

  it('opens on hover and on keyboard focus, and closes on Escape', async () => {
    const el = await render(
      <div>
        <HoverCard title="Rojão Studio" openDelay={0} closeDelay={0}>
          <Link />
        </HoverCard>
        <p style={{ marginTop: 160 }}>Fora</p>
      </div>,
    );
    const link = el.querySelector('a')!;
    const away = el.querySelector('p')!;
    await userEvent.hover(away);
    await userEvent.hover(link);
    await vi.waitFor(() => expect(card()).not.toBeNull());
    await userEvent.hover(away);
    await vi.waitFor(() => expect(card()).toBeNull());
    link.focus();
    await vi.waitFor(() => expect(card()).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(card()).toBeNull());
  });
});
