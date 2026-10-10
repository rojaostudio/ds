/**
 * Browser test helpers (2.0, #13): render a component with the [RDS] stylesheet in light or
 * dark, and run axe on it with every violation as a failure.
 */
import '../../styles/rds.css';
import axe from 'axe-core';
import type { ReactNode } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { commands } from 'vitest/browser';

declare module 'vitest/browser' {
  interface BrowserCommands {
    /** page.emulateMedia (vitest.config.ts): the CSS media type of the page, `null` back to the default. */
    emulateMedia: (media: 'print' | 'screen' | null) => Promise<void>;
  }
}

/** Switches the page to the print media type (`'print'`), or back (`null`), as Chromium does when it prints. */
export const setMedia = (media: 'print' | null) => commands.emulateMedia(media);

export type Mode = 'light' | 'dark';
export const MODES: Mode[] = ['light', 'dark'];

let root: Root | null = null;
let host: HTMLElement | null = null;

/**
 * Renders into a <main> by default. `host: 'div'` renders at the top level instead, for the page landmarks
 * (<header> is the banner and <footer> the contentinfo only outside <main>).
 */
export async function render(ui: ReactNode, mode: Mode = 'light', options: { host?: 'main' | 'div' } = {}): Promise<HTMLElement> {
  cleanup();
  document.documentElement.classList.toggle('dark', mode === 'dark');
  document.body.style.background = 'var(--surface-card)';
  document.body.style.color = 'var(--text-body)';
  host = document.createElement(options.host ?? 'main');
  host.style.padding = '16px';
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root!.render(ui));
  return host;
}

/** light, dark and the brand plate (the theme's brand mode, `.ds-plate`): the three schemes a component passes axe in. */
export type Scheme = Mode | 'plate';
export const SCHEMES: Scheme[] = ['light', 'dark', 'plate'];

/** Renders in light, dark, or on the brand plate (a `.ds-plate` band over the page, in light). */
export async function renderIn(ui: ReactNode, scheme: Scheme, options: { host?: 'main' | 'div' } = {}): Promise<HTMLElement> {
  if (scheme !== 'plate') return render(ui, scheme, options);
  return render(
    <div className="ds-plate" style={{ background: 'var(--surface-page)', color: 'var(--text-body)', padding: 16 }}>
      {ui}
    </div>,
    'light',
    options,
  );
}

export function cleanup() {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
}

/**
 * axe violations as readable lines; an empty array is a pass. `exclude` takes selectors out of the run: only
 * for a known violation of the Figma itself, which the test then pins with it.fails.
 */
export async function axeViolations(el: Element, exclude: string[] = []): Promise<string[]> {
  const context = exclude.length ? { include: [el], exclude: exclude.map((s) => [s]) } : el;
  const { violations } = await axe.run(context as axe.ElementContext, { resultTypes: ['violations'] });
  return violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.failureSummary?.split('\n')[1]?.trim() ?? v.help} (${n.target.join(' ')})`));
}

/** Computed value of a CSS custom property on the document. */
export const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * Waits for the overlays to be in place before axe measures: Radix floating layers parked off-screen until
 * positioned (translate(0, -200%)), then every running finite CSS animation (an entry fade).
 */
export async function settle() {
  const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  const parked = () =>
    [...document.querySelectorAll<HTMLElement>('[data-radix-popper-content-wrapper]')].some((w) =>
      w.style.transform.includes('-200%'),
    );
  for (let i = 0; i < 60 && parked(); i++) await frame();
  // Still parked means the trigger never got Radix's ref: axe would skip the layer and pass for nothing.
  if (parked()) throw new Error('settle(): a floating layer was never positioned (does the trigger forward its ref?)');
  await frame();
  const finite = document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
  await Promise.all(finite.map((a) => a.finished.catch(() => undefined)));
}
