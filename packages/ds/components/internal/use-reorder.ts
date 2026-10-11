import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { announce } from './announce';

/** The pointer must travel this far before a press becomes a drag (mouse and pen). */
const DRAG_DISTANCE = 4;
/**
 * A still press this long picks the item up. On touch it is the only way in, so a swipe over the list still scrolls
 * the page; released without moving, the item stays picked up and the next tap says where it goes (WCAG 2.5.7: moving
 * without dragging).
 */
const HOLD_MS = 400;
/** A touch that moves this far before the hold ends is a scroll, not a drag. */
const TOUCH_SLOP = 8;

interface Press {
  item: string;
  pointerId: number;
  touch: boolean;
  x: number;
  y: number;
  active: boolean;
  /** The pointer travelled after the item was picked up: a drag, dropped where it is let go. */
  moved: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

export interface UseReorderOptions {
  /** The values in their committed order. Each one must be unique: it is the key of its element. */
  items: string[];
  enabled: boolean;
  /** Called with the new order when a drag, a tap or a keyboard move is dropped somewhere new. */
  onCommit: (next: string[]) => void;
}

/**
 * Reorders a wrapping row (or grid) of items, with no dependency: drag them (pointer events); or hold one still and
 * tap where it goes; or, focused, Space picks up, the arrows move, Space drops and Escape cancels. Each step is
 * announced. Each item element needs `data-reorder-item={value}` inside the element given to `listRef`. While moving,
 * `order` is the preview.
 */
export function useReorder({ items, enabled, onCommit }: UseReorderOptions) {
  const [preview, setPreview] = useState<string[] | null>(null);
  const [held, setHeld] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const press = useRef<Press | null>(null);
  const previewRef = useRef<string[] | null>(null);
  /** True right after a pointer move ends, so the click that follows the pointerup does nothing. */
  const dragged = useRef(false);
  const order = preview ?? items;

  function show(next: string[] | null) {
    previewRef.current = next;
    setPreview(next);
  }

  const position = (list: string[], item: string) => `posição ${list.indexOf(item) + 1} de ${list.length}`;

  function swallowClick() {
    dragged.current = true;
    setTimeout(() => (dragged.current = false), 0);
  }

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

  /** The item whose box is under the point, or the nearest one (the gaps between items belong to someone). */
  function itemAt(x: number, y: number): string | null {
    const elements = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-reorder-item]') ?? []);
    let best: string | null = null;
    let bestDistance = Infinity;
    for (const element of elements) {
      const box = element.getBoundingClientRect();
      const dx = x < box.left ? box.left - x : x > box.right ? x - box.right : 0;
      const dy = y < box.top ? box.top - y : y > box.bottom ? y - box.bottom : 0;
      // A row away weighs more than an item away: wrapping rows read left to right first.
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
        clearTimeout(p.timer);
        start(p);
      }
      if (distance >= DRAG_DISTANCE) p.moved = true;
      if (!p.moved) return;
      const target = itemAt(event.clientX, event.clientY);
      if (target) moveTo(p.item, target);
    }
    function up(event: globalThis.PointerEvent) {
      const p = press.current;
      if (!p || event.pointerId !== p.pointerId) return;
      clearTimeout(p.timer);
      if (!p.active) {
        press.current = null;
        return;
      }
      swallowClick();
      if (p.moved) {
        finish(true);
      } else {
        // Held still and let go: the item stays picked up until the next tap says where it goes.
        press.current = null;
        announce(`${p.item} pego, ${position(items, p.item)}. Toque onde quer colocar.`);
      }
    }
    function cancel(event: globalThis.PointerEvent) {
      if (press.current && event.pointerId === press.current.pointerId) finish(false);
    }
    // Picked up by a tap: a press outside the list puts it back.
    function outside(event: globalThis.PointerEvent) {
      if (held && !press.current && !listRef.current?.contains(event.target as Node)) finish(false);
    }
    // While a touch drag is on, the page must not scroll under the finger.
    function touchMove(event: TouchEvent) {
      if (press.current?.active) event.preventDefault();
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('pointerdown', outside);
    window.addEventListener('touchmove', touchMove, { passive: false });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('pointerdown', outside);
      window.removeEventListener('touchmove', touchMove);
    };
  });

  function onPointerDown(event: PointerEvent<HTMLElement>, item: string) {
    if (!enabled || event.button !== 0) return;
    // The × and the edit field keep their own pointer.
    if ((event.target as HTMLElement).closest('button, input')) return;
    if (held) {
      // Picked up (by a hold or by Space): this tap says where it goes.
      if (press.current) return;
      event.preventDefault();
      swallowClick();
      moveTo(held, item);
      finish(true);
      return;
    }
    const p: Press = {
      item,
      pointerId: event.pointerId,
      touch: event.pointerType === 'touch',
      x: event.clientX,
      y: event.clientY,
      active: false,
      moved: false,
    };
    p.timer = setTimeout(() => press.current === p && !p.active && start(p), HOLD_MS);
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
        announce(`${item} pego, ${position(items, item)}. Use as setas para mover, Espaço para soltar e Esc para cancelar.`);
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
