import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { userEvent } from 'vitest/browser';
import { ChoiceCard, ChoiceCardGroup, type ChoiceCardLayout } from './choice-card';
import { SelectableCard } from './selectable-card';
import { OptionTile, OptionTileGrid } from './option-tile';
import { ChoicePreviewCard } from './choice-preview-card';
import { CalendarIcon, MapPinIcon, StarIcon } from './internal/icons';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const options = (
  <>
    <ChoiceCard value="entrega" icon={<MapPinIcon />} description="No endereço que você escolher.">
      Entrega
    </ChoiceCard>
    <ChoiceCard value="retirada" icon={<CalendarIcon />} description="Na loja, no horário que quiser.">
      Retirada
    </ChoiceCard>
    <ChoiceCard value="expressa">Expressa</ChoiceCard>
  </>
);

describe.each(MODES)('ChoiceCard (%s)', (mode) => {
  it('selected and not selected, with and without icon and description, pass axe', async () => {
    const el = await render(
      <div style={{ maxWidth: 400 }}>
        <ChoiceCardGroup legend="Forma de entrega" defaultValue="retirada">
          {options}
        </ChoiceCardGroup>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('disabled, selected and not, passes axe', async () => {
    const el = await render(
      <div style={{ maxWidth: 400 }}>
        <ChoiceCardGroup legend="Forma de entrega" defaultValue="retirada" disabled>
          {options}
        </ChoiceCardGroup>
      </div>,
      mode,
    );
    // Disabled controls are out of the contrast rule (WCAG 1.4.3 exempts inactive components).
    expect(await axeViolations(el)).toEqual([]);
  });
});

const LAYOUTS: ChoiceCardLayout[] = ['tile', 'preview'];

describe.each(MODES)('ChoiceCard layouts (%s)', (mode) => {
  it.each(LAYOUTS)('%s, selected and not, passes axe', async (layout) => {
    const el = await render(
      <div style={{ maxWidth: 560 }}>
        <ChoiceCardGroup legend="Forma de entrega" defaultValue="retirada" layout={layout}>
          {options}
        </ChoiceCardGroup>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it.each(LAYOUTS)('%s, disabled, passes axe', async (layout) => {
    const el = await render(
      <div style={{ maxWidth: 560 }}>
        <ChoiceCardGroup legend="Forma de entrega" defaultValue="retirada" layout={layout} disabled>
          {options}
        </ChoiceCardGroup>
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('ChoiceCard layouts behaviour', () => {
  // The [RDS] draws the chosen description at full opacity (it was 70%: 4.33:1 on white in light for the preview,
  // 4.28:1 for the tile in dark).
  it('the chosen preview description passes axe on the rojao light theme', async () => {
    const el = await render(
      <div style={{ width: 240 }}>
        <ChoiceCard layout="preview" name="b" selected description="Descrição breve da opção.">
          Opção
        </ChoiceCard>
      </div>,
      'light',
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('the chosen tile description passes axe on the rojao dark theme', async () => {
    const el = await render(
      <div style={{ width: 240 }}>
        <ChoiceCard layout="tile" name="b" selected description="Descrição breve da opção.">
          Opção
        </ChoiceCard>
      </div>,
      'dark',
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('row is the default; the group passes its layout to the cards and lays tiles in a grid', async () => {
    const el = await render(
      <div style={{ width: 520 }}>
        <ChoiceCard name="x">Sozinho</ChoiceCard>
        <ChoiceCardGroup legend="Entrega" layout="tile">
          {options}
        </ChoiceCardGroup>
      </div>,
    );
    const [alone, ...tiles] = el.querySelectorAll<HTMLElement>('.rds-choice-card');
    expect(alone.className).toContain('rds-choice-card--row');
    expect(alone.querySelector('.rds-choice-card__radio')).not.toBeNull();
    expect(tiles.every((t) => t.className.includes('rds-choice-card--tile'))).toBe(true);
    expect(getComputedStyle(el.querySelector('fieldset')!).display).toBe('grid');
    const [a, b, c] = tiles.map((t) => t.getBoundingClientRect());
    expect(a.top).toBe(b.top);
    expect(b.top).toBe(c.top);
    expect(a.width).toBeGreaterThanOrEqual(160);
  });

  it('tile: the check shows in the corner only when chosen; it is still a radio', async () => {
    const el = await render(
      <ChoiceCardGroup legend="Entrega" layout="tile" defaultValue="retirada">
        {options}
      </ChoiceCardGroup>,
    );
    const checks = el.querySelectorAll('.rds-choice-card__check');
    expect(checks).toHaveLength(1);
    expect(checks[0].closest('label')!.textContent).toContain('Retirada');
    expect(checks[0].getAttribute('aria-hidden')).toBe('true');
    const card = checks[0].closest('label')!.getBoundingClientRect();
    const check = checks[0].getBoundingClientRect();
    expect([card.right - check.right, check.top - card.top]).toEqual([8, 8]);
    expect(el.querySelectorAll('input[type="radio"]')).toHaveLength(3);
  });

  it('preview: the picture on top (a placeholder without one), the check in its corner, a 2px border when chosen', async () => {
    const el = await render(
      <div style={{ width: 240 }}>
        <ChoiceCard layout="preview" name="tema" selected preview={<span className="swatch" />}>
          Escuro
        </ChoiceCard>
        <ChoiceCard layout="preview" name="tema">
          Claro
        </ChoiceCard>
      </div>,
    );
    const [chosen, other] = el.querySelectorAll<HTMLElement>('.rds-choice-card');
    expect(chosen.querySelector('.rds-choice-card__preview .swatch')).not.toBeNull();
    expect(chosen.querySelector('.rds-choice-card__preview .rds-choice-card__check')).not.toBeNull();
    expect(getComputedStyle(chosen).borderTopWidth).toBe('2px');
    expect(other.querySelector('.rds-choice-card__placeholder svg')).not.toBeNull();
    expect(getComputedStyle(other).borderTopWidth).toBe('1px');
    const preview = other.querySelector('.rds-choice-card__preview')!.getBoundingClientRect();
    expect(Math.round((preview.width / preview.height) * 9)).toBe(16);
  });
});

describe('ChoiceCard deprecated wrappers', () => {
  it('SelectableCard is a row ChoiceCard; onClick chooses', async () => {
    const onClick = vi.fn();
    const el = await render(
      <SelectableCard onClick={onClick}>
        Plano mensal
      </SelectableCard>,
    );
    const card = el.querySelector<HTMLLabelElement>('.rds-choice-card--row')!;
    expect(card.querySelector('input[type="radio"]')).not.toBeNull();
    await act(async () => card.click());
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('OptionTileGrid: one at a time as radios; with multiple, checkboxes that toggle', async () => {
    const onChange = vi.fn();
    const onMany = vi.fn();
    const items = [
      { value: 'a', label: 'Roupas', icon: StarIcon },
      { value: 'b', label: 'Calçados' },
    ];
    const el = await render(
      <div>
        <OptionTileGrid label="Segmento" options={items} value="a" onChange={onChange} />
        <OptionTileGrid label="Canais" options={items} multiple value={['a']} onChange={onMany} />
      </div>,
    );
    const [single, multi] = el.querySelectorAll('fieldset');
    expect(single.querySelector('legend')!.textContent).toBe('Segmento');
    expect(single.querySelectorAll('input[type="radio"]')).toHaveLength(2);
    expect(single.querySelector<HTMLInputElement>('input')!.checked).toBe(true);
    await act(async () => single.querySelectorAll<HTMLLabelElement>('label')[1].click());
    expect(onChange).toHaveBeenLastCalledWith('b');
    const boxes = multi.querySelectorAll<HTMLLabelElement>('label');
    expect(multi.querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
    await act(async () => boxes[0].click());
    expect(onMany).toHaveBeenLastCalledWith([]);
    await act(async () => boxes[1].click());
    expect(onMany).toHaveBeenLastCalledWith(['a', 'b']);
  });

  it('OptionTile alone and ChoicePreviewCard keep compiling and render the new layouts', async () => {
    const el = await render(
      <div>
        <OptionTile selected label="Roupas" onClick={() => {}} fullSpan />
        <ChoicePreviewCard selected={false} onSelect={() => {}} preview={<span />} label="Grade" description="Duas colunas." />
      </div>,
    );
    expect(el.querySelector('.rds-choice-card--tile .rds-choice-card__check')).not.toBeNull();
    const preview = el.querySelector('.rds-choice-card--preview')!;
    expect(preview.querySelector('.rds-choice-card__label')!.textContent).toBe('Grade');
  });
});

describe('ChoiceCard behaviour', () => {
  it('is a native radio named by its label and described by its description', async () => {
    const el = await render(<ChoiceCardGroup legend="Forma de entrega">{options}</ChoiceCardGroup>);
    const radios = el.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios).toHaveLength(3);
    expect(el.querySelector('fieldset > legend')!.textContent).toBe('Forma de entrega');
    const first = radios[0];
    expect(first.closest('label')!.textContent).toContain('Entrega');
    expect(document.getElementById(first.getAttribute('aria-describedby')!)!.textContent).toBe('No endereço que você escolher.');
    expect(new Set([...radios].map((r) => r.name)).size).toBe(1);
  });

  it('keyboard: Tab reaches the group, the arrows move and choose, one at a time', async () => {
    const onValueChange = vi.fn();
    const el = await render(
      <div>
        <button type="button">Antes</button>
        <ChoiceCardGroup legend="Forma de entrega" onValueChange={onValueChange}>
          {options}
        </ChoiceCardGroup>
      </div>,
    );
    const [entrega, retirada] = el.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    el.querySelector('button')!.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(entrega);
    await userEvent.keyboard(' ');
    expect(onValueChange).toHaveBeenLastCalledWith('entrega');
    expect(entrega.closest('label')!.className).toContain('rds-choice-card--selected');
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(retirada);
    expect(onValueChange).toHaveBeenLastCalledWith('retirada');
    expect(retirada.checked).toBe(true);
    expect(entrega.closest('label')!.className).not.toContain('rds-choice-card--selected');
  });

  it('alone, it is controlled by selected and onSelect; disabled does not choose', async () => {
    const onSelect = vi.fn();
    const el = await render(
      <div>
        <ChoiceCard name="plano" selected={false} onSelect={onSelect}>
          Mensal
        </ChoiceCard>
        <ChoiceCard name="plano" selected={false} onSelect={onSelect} disabled>
          Anual
        </ChoiceCard>
      </div>,
    );
    const [mensal, anual] = el.querySelectorAll<HTMLLabelElement>('label');
    await act(async () => mensal.click());
    expect(onSelect).toHaveBeenCalledOnce();
    await act(async () => anual.click());
    expect(onSelect).toHaveBeenCalledOnce();
    expect(anual.querySelector('input')!.disabled).toBe(true);
  });
});
