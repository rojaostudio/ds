import { afterEach, describe, expect, it } from 'vitest';
import { Link } from './link';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

describe.each(MODES)('Link (%s)', (mode) => {
  it('both tones, inside a sentence, pass axe', async () => {
    const el = await render(
      <p style={{ fontSize: 14, lineHeight: '20px' }}>
        Ainda não tem conta? <Link href="/signup">Criar conta grátis</Link>. Ou leia os <Link tone="neutral" href="/termos">termos</Link>.
      </p>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Link', () => {
  it('is an <a>, underlined, with no padding, and keeps the line height of the sentence', async () => {
    const el = await render(
      <p style={{ fontSize: 14, lineHeight: '20px', margin: 0 }}>
        Ainda não tem conta? <Link href="/signup">Criar conta grátis</Link>
      </p>,
    );
    const a = el.querySelector('a')!;
    const cs = getComputedStyle(a);
    expect(cs.textDecorationLine).toBe('underline');
    expect(cs.paddingLeft).toBe('0px');
    expect(cs.fontSize).toBe('14px');
    expect(el.querySelector('p')!.getBoundingClientRect().height).toBe(20);
  });

  it('the touch layer gives a 24 target without changing the line', async () => {
    const el = await render(
      <p style={{ fontSize: 14, lineHeight: '20px', margin: 0 }}>
        <Link href="/x">Esqueci a senha</Link>
      </p>,
    );
    const after = getComputedStyle(el.querySelector('a')!, '::after');
    expect(after.position).toBe('absolute');
    expect(after.top).toBe('-2px');
  });

  it('asChild renders a button with the link styles', async () => {
    const el = await render(
      <Link asChild>
        <button type="button">Usar outro e-mail</button>
      </Link>,
    );
    const b = el.querySelector('button')!;
    expect(b.className).toContain('rds-link');
    expect(getComputedStyle(b).paddingTop).toBe('0px');
  });
});
