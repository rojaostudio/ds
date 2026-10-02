import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { GoogleButton, type GoogleButtonShape, type GoogleButtonTheme, type GoogleButtonType } from './google-button';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const THEMES: GoogleButtonTheme[] = ['light', 'dark', 'neutral'];
const SHAPES: GoogleButtonShape[] = ['rectangular', 'pill'];
const TYPES: GoogleButtonType[] = ['standard', 'icon'];

describe.each(MODES)('GoogleButton (%s)', (mode) => {
  it('every theme × shape × type passes axe', async () => {
    const el = await render(
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {THEMES.flatMap((theme) =>
          SHAPES.flatMap((shape) => TYPES.map((type) => <GoogleButton key={`${theme}-${shape}-${type}`} theme={theme} shape={shape} type={type} />)),
        )}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('GoogleButton behaviour', () => {
  it('a button 40 tall with the G (20) and the label; icon is 40 × 40 and named by the label', async () => {
    const onClick = vi.fn();
    const el = await render(
      <div>
        <GoogleButton onClick={onClick}>Continuar com o Google</GoogleButton>
        <GoogleButton type="icon" shape="pill" />
      </div>,
    );
    const [standard, icon] = el.querySelectorAll<HTMLButtonElement>('button');
    expect(standard.type).toBe('button');
    expect(standard.textContent).toBe('Continuar com o Google');
    expect(standard.offsetHeight).toBe(40);
    expect(standard.querySelector('svg')!.getBoundingClientRect().width).toBe(20);
    expect(standard.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    expect([icon.offsetWidth, icon.offsetHeight]).toEqual([40, 40]);
    expect(icon.getAttribute('aria-label')).toBe('Fazer login com o Google');
    expect(getComputedStyle(icon).borderTopLeftRadius).toBe('20px');
    await act(async () => standard.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
