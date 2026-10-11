import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { announce } from './announce';

/** The pointer must travel this far before a press becomes a drag (mouse and pen). */
const DRAG_DISTANCE = 4;
/** On touch, a drag starts after a still press this long, so a swipe over the list still scrolls the page. */
const TOUCH_HOLD_MS = 400;
/** A touch that moves this far before the hold ends is a scroll, not a drag. */
const TOUCH_SLOP = 8;

interface Press {
  item: string;
  pointerId: number;
  touch: boolean;
  x: number;
  y: number;
  active: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

export interface UseReorderOptions {
  /** The values in their committed order. Each one must be unique: it is the key of its element. */
  items: string[];
  enabled: boolean;
  /** Called with the new order when a drag or a keyboard move is dropped somewhere new. */
  onCommit: (next: string[]) => void;
}

/**
 * Reorders a wrapping row of items by dragging (pointer events, no dependency) or by keyboard (Space picks up, the
 * arrows move, Space drops, Escape cancels), announcing each position. Each item element needs
 * `data-reorder-item={value}` inside the element given to `listRef`. While moving, `order` is the preview.
 */
export function useReorder({ items, enabled, onCommit }: UseReorderOptions) {
  const [preview, setPreview] = useState<string[] | null>(null);
  const [held, setHeld] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const press = useRef<Press | null>(null);
  const previewRef = useRef<string[] | null>(null);
  /** True right after a drag ends, so the click that follows the pointerup does nothing. */
  const dragged = useRef(false);
  const order = preview ?? items;

  function show(next: string[] | null) {
    previewRef.current = next;
    setPreview(next);
  }

  const position = (list: string[], item: string) => `posição ${list.indexOf(item) + 1} de ${list.length}`;

  function finish(commit: boolean) {
    const p = press.current;
    if (p?.timer) clearTimeout(p.timer);
    press.current = null;
    const next = previewRef.current;
    const item = held ?? p?.item;
    if (commit && next && next.some((value, index) => value !== items[index])) {
      onCommit(next);
      if (item) announce(`${item} solto na ${position(next, item)}`);
    } else if (!commit && item && next) {
      announce(`Movimento cancelado. ${item} voltou à ${position(items, item)}`);
    }
    show(null);
    setHeld(null);
  }

  /** The item whose box is under the point, or the nearest one (the gaps between chips belong to someone). */
  function itemAt(x: number, y: number): string | null {
    const elements = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-reorder-item]') ?? []);
    let best: string | null = null;
    let bestDistance = Infinity;
    for (const element of elements) {
      const box = element.getBoundingClientRect();
      const dx = x < box.left ? box.left - x : x > box.right ? x - box.right : 0;
      const dy = y < box.top ? box.top - y : y > box.bottom ? y - box.bottom : 0;
      // A row away weighs more than a chip away: wrapping rows read left to right first.
      const distance = dy * 4 + dx;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = element.dataset.reorderItem ?? null;
      }
    }
    return best;
  }

  function moveTo(item: string, target: string) {
    const current = previewRef.current ?? items;
    if (item === target) return;
    const next = current.filter((value) => value !== item);
    next.splice(current.indexOf(target), 0, item);
    show(next);
  }

  function start(p: Press) {
    p.active = true;
    show(items);
    setHeld(p.item);
  }

  useEffect(() => {
    if (!enabled) return;
    function move(event: globalThis.PointerEvent) {
      const p = press.current;
      if (!p || event.pointerId !== p.pointerId) return;
      const distance = Math.hypot(event.clientX - p.x, event.clientY - p.y);
      if (!p.active) {
        if (p.touch) {
          if (distance > TOUCH_SLOP) {
            clearTimeout(p.timer);
            press.current = null;
          }
          return;
        }
        if (distance < DRAG_DISTANCE) return;
        start(p);
      }
      const target = itemAt(event.clientX, event.clientY);
      if (target) moveTo(p.item, target);
    }
    function up(event: globalThis.PointerEvent) {
      const p = press.current;
      if (!p || event.pointerId !== p.pointerId) return;
      if (p.active) {
        dragged.current = true;
        requestAnimationFrame(() => (dragged.current = false));
        finish(true);
      } else {
        clearTimeout(p.timer);
        press.current = null;
      }
    }
    function cancel(event: globalThis.PointerEvent) {
      if (press.current && event.pointerId === press.current.pointerId) finish(false);
    }
    // While a touch drag is on, the page must not scroll under the finger.
    function touchMove(event: TouchEvent) {
      if (press.current?.active) event.preventDefault();
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('touchmove', touchMove, { passive: false });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('touchmove', touchMove);
    };
  });

  function onPointerDown(event: PointerEvent<HTMLElement>, item: string) {
    if (!enabled || event.button !== 0 || held) return;
    // The × and the edit field keep their own pointer.
    if ((event.target as HTMLElement).closest('button, input')) return;
    const p: Press = {
      item,
      pointerId: event.pointerId,
      touch: event.pointerType === 'touch',
      x: event.clientX,
      y: event.clientY,
      active: false,
    };
    if (p.touch) p.timer = setTimeout(() => press.current === p && start(p), TOUCH_HOLD_MS);
    press.current = p;
  }

  /** Space picks up and drops, the arrows move, Escape cancels. Returns true when the key was handled. */
  function onKeyDown(event: KeyboardEvent<HTMLElement>, item: string): boolean {
    if (!enabled || event.target !== event.currentTarget) return false;
    if (event.key === ' ') {
      event.preventDefault();
      if (held === item) {
        finish(true);
      } else {
        show(items);
        setHeld(item);
        announce(
          `${item} pego, ${position(items, item)}. Use as setas para mover, Espaço para soltar e Esc para cancelar.`,
        );
      }
      return true;
    }
    if (held !== item) return false;
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
    if (step) {
      event.preventDefault();
      const current = previewRef.current ?? items;
      const index = current.indexOf(item) + step;
      if (index >= 0 && index < current.length) {
        const next = current.filter((value) => value !== item);
        next.splice(index, 0, item);
        show(next);
        announce(position(next, item));
      }
      return true;
    }
    if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape') event.preventDefault();
      finish(false);
      return event.key === 'Escape';
    }
    return false;
  }

  return { order, held, listRef, dragged, onPointerDown, onKeyDown };
}
