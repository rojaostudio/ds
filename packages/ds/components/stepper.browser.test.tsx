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

describe('Stepper: the barrel', () => {
  it('the barrel exports the Stepper', () => {
    expect(StepperFromBarrel).toBe(Stepper);
  });
});
