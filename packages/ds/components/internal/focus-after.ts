// Where the focus goes when an element that holds it leaves the page (an Alert closed with its ×): the next
// focusable element after it in document order, or the previous one, so the keyboard does not fall back to the
// top of the page. Not exported.
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusAfter(element: HTMLElement | null) {
  if (!element || typeof document === 'undefined') return;
  const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !element.contains(el));
  const next = all.find((el) => element.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
  const previous = [...all].reverse().find((el) => element.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING);
  const target = next ?? previous;
  // After React takes the element out.
  requestAnimationFrame(() => target?.focus());
}
