/**
 * Behaviour checks shared by the modal overlays (Dialog, Sheet, Drawer, Command): the focus stays inside while
 * Tab and Shift+Tab go round, and the page behind doesn't scroll.
 */
import { expect } from 'vitest';
import { userEvent } from 'vitest/browser';

/** Tabs forward and back more times than there are controls; the focus never leaves `box`. */
export async function expectFocusTrapped(box: HTMLElement) {
  const count = box.querySelectorAll('button, input, a[href], textarea, select, [tabindex="0"]').length;
  for (let i = 0; i < count + 2; i++) {
    await userEvent.tab();
    expect(box.contains(document.activeElement), `Tab ${i + 1} left the layer`).toBe(true);
  }
  for (let i = 0; i < count + 2; i++) {
    await userEvent.tab({ shift: true });
    expect(box.contains(document.activeElement), `Shift+Tab ${i + 1} left the layer`).toBe(true);
  }
}

/** The page behind can't scroll (Radix's react-remove-scroll locks the body). */
export const scrollLocked = () => getComputedStyle(document.body).overflow === 'hidden';
