import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, useState } from 'react';
import { Chip } from './chip';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const Tag = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="4" />
  </svg>
);

describe.each(MODES)('Chip (%s)', (mode) => {
  it('plain, with icon, removable and disabled pass axe', async () => {
    const el = await render(
      <ul style={{ display: 'flex', gap: 8, listStyle: 'none', padding: 0 }}>
        <li><Chip>Design</Chip></li>
        <li><Chip icon={<Tag />}>Com problema</Chip></li>
        <li><Chip onRemove={() => {}}>Frete grátis</Chip></li>
        <li><Chip onRemove={() => {}} disabled>Importado</Chip></li>
      </ul>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Chip behaviour', () => {
  it('the × is named after the label, removes and announces it', async () => {
    const onRemove = vi.fn();
    const el = await render(<Chip onRemove={onRemove}>Frete grátis</Chip>);
    const x = el.querySelector('button')!;
    expect(x.getAttribute('aria-label')).toBe('Remover Frete grátis');
    x.click();
    expect(onRemove).toHaveBeenCalledOnce();
    await vi.waitFor(() =>
      expect(document.querySelector('[data-rds-announcer]')?.textContent).toBe('Frete grátis removido'),
    );
  });

  it('without onRemove there is no × (showRemove off)', async () => {
    const el = await render(<Chip>Design</Chip>);
    expect(el.querySelector('button')).toBeNull();
  });

  it('disabled: the × stays focusable but does not remove', async () => {
    const onRemove = vi.fn();
    const el = await render(<Chip onRemove={onRemove} disabled>Frete grátis</Chip>);
    const x = el.querySelector('button')!;
    x.focus();
    expect(document.activeElement).toBe(x);
    expect(x.getAttribute('aria-disabled')).toBe('true');
    x.click();
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('after a removal, focus goes to the next chip ×', async () => {
    function List() {
      const [items, setItems] = useState(['Frete grátis', 'Usado', 'Importado']);
      return (
        <ul>
          {items.map((item) => (
            <li key={item}>
              <Chip onRemove={() => setItems((all) => all.filter((x) => x !== item))}>{item}</Chip>
            </li>
          ))}
        </ul>
      );
    }
    const el = await render(<List />);
    await act(async () => (el.querySelector('[aria-label="Remover Frete grátis"]') as HTMLButtonElement).click());
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toBe('Remover Usado'));
  });
});
