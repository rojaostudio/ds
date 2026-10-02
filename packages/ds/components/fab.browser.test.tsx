import { afterEach, describe, expect, it, vi } from 'vitest';
import { FAB } from './fab';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const Plus = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

describe.each(MODES)('FAB (%s)', (mode) => {
  it('with and without icon, enabled and disabled, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'flex', gap: 16 }}>
        <FAB>Novo pedido</FAB>
        <FAB icon={<Plus />}>Novo pedido</FAB>
        <FAB icon={<Plus />} disabled>Novo pedido</FAB>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('is 56px tall', async () => {
    const el = await render(<FAB icon={<Plus />}>Novo pedido</FAB>, mode);
    expect(el.querySelector('button')!.getBoundingClientRect().height).toBe(56);
  });
});

describe('FAB behaviour', () => {
  it('the label is the accessible name; the icon is hidden', async () => {
    const el = await render(<FAB icon={<Plus />}>Novo pedido</FAB>);
    expect(el.querySelector('button')!.textContent).toBe('Novo pedido');
    expect(el.querySelector('.rds-fab__icon')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('disabled stays focusable and ignores clicks', async () => {
    const onClick = vi.fn();
    const el = await render(<FAB disabled onClick={onClick}>Novo pedido</FAB>);
    const b = el.querySelector('button')!;
    b.focus();
    expect(document.activeElement).toBe(b);
    expect(b.getAttribute('aria-disabled')).toBe('true');
    b.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('asChild renders a link with the FAB look (no router imported)', async () => {
    const el = await render(
      <FAB asChild icon={<Plus />}>
        <a href="#nova">Novo pedido</a>
      </FAB>,
    );
    const a = el.querySelector('a')!;
    expect(a.className).toContain('rds-fab');
    expect(a.querySelector('.rds-fab__icon')).not.toBeNull();
    expect(el.querySelector('button')).toBeNull();
    expect(await axeViolations(el)).toEqual([]);
  });
});
