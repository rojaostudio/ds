/**
 * The deprecated 1.x base.css next to rds.css (2.0): base.css lives in the rds.legacy layer, declared below
 * rds.theme, so wherever the two declare the same variable (31 names: --surface-page, --text-muted, --toast-text,
 * --radius-card, --z-modal, --space-*…) the 2.0 wins, whatever the import order. The h1–h6 rule of base.css loses
 * to the 2.0 Heading. Without the layer, base.css (unlayered) beat every rds.* layer.
 */
import '../../styles/base.css';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { Button } from '../button';
import { Card, CardContent, CardHeader } from '../card';
import { Dialog } from '../dialog';
import { Heading } from '../heading';
import { ToastView } from '../toast';
import { cleanup, cssVar, render, settle } from './render';

afterEach(() => {
  act(() => cleanup());
});

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

describe('base.css (rds.legacy) with rds.css', () => {
  it('base.css is loaded: its own, non-colliding variables are there', async () => {
    await render(<div />);
    expect(cssVar('--brand-primary')).toBe('#171717');
    expect(cssVar('--color-zinc-500')).not.toBe('');
  });

  it('the colliding variables take the 2.0 value, light and dark', async () => {
    await render(<div />);
    expect(cssVar('--surface-page')).toBe('#f4f4f5');
    expect(cssVar('--text-muted')).toBe('#3f3f46');
    expect(cssVar('--border-default')).toBe('#e4e4e7');
    expect(cssVar('--radius-card')).toBe('12px');
    expect(cssVar('--z-modal')).toBe('1300');
    expect(cssVar('--space-16')).toBe('16px');
    await render(<div />, 'dark');
    expect(cssVar('--text-muted')).toBe('#d4d4d8');
    expect(cssVar('--border-default')).toBe('#27272a');
  });

  it('Toast: text and border are the 2.0 tokens, not the 1.x dark toast', async () => {
    const el = await render(<ToastView title="Disparo agendado" description="Terça, 10h." />);
    const text = el.querySelector<HTMLElement>('.rds-toast__description') ?? el.querySelector<HTMLElement>('.rds-toast')!;
    const toast = el.querySelector<HTMLElement>('.rds-toast')!;
    expect(cssVar('--toast-text')).not.toBe('#fafafa');
    expect(getComputedStyle(text).color).toBe(rgb('#3f3f46'));
    expect(getComputedStyle(toast).borderTopColor).toBe(rgb('#e4e4e7'));
  });

  it('Card: background and border from the 2.0 theme', async () => {
    const el = await render(
      <Card>
        <CardHeader title="Plano Essencial" />
        <CardContent>Até 3 pedidos.</CardContent>
      </Card>,
    );
    const card = el.querySelector<HTMLElement>('.rds-card')!;
    expect(getComputedStyle(card).backgroundColor).toBe(rgb('#ffffff'));
    expect(getComputedStyle(card).borderTopColor).toBe(rgb('#e4e4e7'));
  });

  it('Dialog: the 2.0 z-index (1300), not the 1.x one (1050)', async () => {
    const el = await render(<Dialog trigger={<Button>Abrir</Button>} title="Novo público" confirmLabel="Criar" onConfirm={() => {}} />);
    el.querySelector('button')!.click();
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    await settle();
    expect(getComputedStyle(document.querySelector<HTMLElement>('[role="dialog"]')!).zIndex).toBe('1300');
  });

  it('Heading: the 2.0 font stack wins over the h1–h6 rule of base.css', async () => {
    const el = await render(<Heading as="h1">Título</Heading>);
    const h1 = el.querySelector('h1')!;
    expect(getComputedStyle(h1).fontFamily).toBe(getComputedStyle(document.documentElement).getPropertyValue('--type-font-stack').trim());
  });
});
