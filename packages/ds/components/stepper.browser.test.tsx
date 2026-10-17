import { afterEach, describe, expect, it, vi } from 'vitest';
import { Stepper } from './stepper';
import { Stepper as StepperFromBarrel } from './index';
import { RotateCcwIcon } from './internal/icons';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const STEPS = [
  { key: 'cart', label: 'Carrinho' },
  { key: 'customer', label: 'Cliente' },
  { key: 'payment', label: 'Pagamento' },
];

describe.each(MODES)('Stepper (%s)', (mode) => {
  it('with the action passes axe', async () => {
    const el = await render(
      <Stepper steps={STEPS} current="customer" action={{ label: 'Recomeçar', icon: <RotateCcwIcon />, onClick: () => {} }} />,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Stepper behaviour', () => {
  it('a named navigation; the current step is the filled Button with aria-current="step"', async () => {
    const el = await render(<Stepper steps={STEPS} current="customer" />);
    const nav = el.querySelector('[role="navigation"]')!;
    expect(nav.getAttribute('aria-label')).toBe('Etapas');
    const [cart, customer, payment] = nav.querySelectorAll<HTMLButtonElement>('.rds-button');
    expect(customer.getAttribute('aria-current')).toBe('step');
    expect(customer.className).toContain('rds-button--fill');
    expect(cart.getAttribute('aria-disabled')).toBeNull();
    expect(payment.getAttribute('aria-disabled')).toBe('true');
    expect(getComputedStyle(nav).borderTopLeftRadius).not.toBe('0px');
  });

  it('earlier steps go back, later ones do nothing; canNavigate changes the rule', async () => {
    const onNavigate = vi.fn();
    const el = await render(<Stepper steps={STEPS} current="customer" onNavigate={onNavigate} />);
    const [cart, customer, payment] = el.querySelectorAll<HTMLButtonElement>('.rds-button');
    cart.click();
    customer.click();
    payment.click();
    expect(onNavigate.mock.calls).toEqual([['cart']]);

    const all = vi.fn();
    const free = await render(<Stepper steps={STEPS} current="cart" onNavigate={all} canNavigate={() => true} />);
    free.querySelectorAll<HTMLButtonElement>('.rds-button')[2].click();
    expect(all).toHaveBeenCalledWith('payment');
  });

  it('the action is a last Button after a vertical Separator, 24 tall', async () => {
    const onClick = vi.fn();
    const el = await render(<Stepper steps={STEPS} current="cart" action={{ label: 'Recomeçar', onClick }} />);
    const line = el.querySelector<HTMLElement>('.rds-stepper__divider')!;
    expect(line.classList.contains('rds-separator--vertical')).toBe(true);
    expect(line.getAttribute('aria-hidden')).toBe('true');
    expect(line.getBoundingClientRect().height).toBe(24);
    const last = [...el.querySelectorAll<HTMLButtonElement>('.rds-button')].at(-1)!;
    expect(last.textContent).toBe('Recomeçar');
    last.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('Stepper accessibility (ds#159)', () => {
  it('an ordered list inside the named navigation; each step says its position after its label', async () => {
    const el = await render(<Stepper steps={STEPS} current="customer" action={{ label: 'Recomeçar', onClick: () => {} }} />);
    const nav = el.querySelector('[role="navigation"]')!;
    const list = nav.querySelector('ol')!;
    expect(list).not.toBeNull();
    const items = [...list.children];
    expect(items.map((li) => li.tagName)).toEqual(['LI', 'LI', 'LI']);
    const names = items.map((li) => li.querySelector('.rds-button')!.textContent);
    expect(names).toEqual(['Carrinho, etapa 1 de 3', 'Cliente, etapa 2 de 3', 'Pagamento, etapa 3 de 3']);
    // The position is for screen readers; the visible label stays the step's.
    const hidden = items[1].querySelector<HTMLElement>('.rds-visually-hidden')!;
    expect(hidden.textContent).toBe(', etapa 2 de 3');
    // The action is not a step: after the list, outside it.
    expect(list.textContent).not.toContain('Recomeçar');
  });

  it('later steps are aria-disabled, not disabled: readable and reachable by Tab, but they do not navigate', async () => {
    const onNavigate = vi.fn();
    const el = await render(<Stepper steps={STEPS} current="customer" onNavigate={onNavigate} />);
    const payment = el.querySelectorAll<HTMLButtonElement>('.rds-button')[2];
    expect(payment.disabled).toBe(false);
    expect(payment.getAttribute('aria-disabled')).toBe('true');
    payment.focus();
    expect(document.activeElement).toBe(payment);
    payment.click();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('positionLabel words the position', async () => {
    const el = await render(<Stepper steps={STEPS} current="cart" positionLabel={(i, n) => `step ${i} of ${n}`} />);
    expect(el.querySelector('.rds-button')!.textContent).toBe('Carrinho, step 1 of 3');
  });
});

describe('Stepper embedded (ds#159)', () => {
  it('floating (the default) is the raised pill; embedded has no surface, border or shadow', async () => {
    const el = await render(
      <div>
        <Stepper steps={STEPS} current="cart" />
        <Stepper steps={STEPS} current="cart" variant="embedded" />
      </div>,
    );
    const [floating, embedded] = el.querySelectorAll<HTMLElement>('.rds-stepper');
    expect(getComputedStyle(floating).boxShadow).not.toBe('none');
    const s = getComputedStyle(embedded);
    expect(embedded.className).toContain('rds-stepper--embedded');
    expect(s.boxShadow).toBe('none');
    expect(s.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(s.borderTopWidth).toBe('0px');
    expect(s.paddingLeft).toBe('0px');
    // The steps stay pills.
    expect(getComputedStyle(embedded.querySelector('.rds-button')!).borderTopLeftRadius).not.toBe('0px');
  });

  it.each(MODES)('embedded passes axe (%s)', async (mode) => {
    const el = await render(<Stepper steps={STEPS} current="customer" variant="embedded" />, mode);
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Stepper: the barrel', () => {
  it('the barrel exports the Stepper', () => {
    expect(StepperFromBarrel).toBe(Stepper);
  });
});
