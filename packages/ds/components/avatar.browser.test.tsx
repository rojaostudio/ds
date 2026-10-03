import { afterEach, describe, expect, it } from 'vitest';
import { Avatar, AvatarGroup, type AvatarSize, type AvatarType } from './avatar';
import { MODES, axeViolations, cleanup, render } from './__tests__/render';

afterEach(cleanup);

const SIZES: AvatarSize[] = ['sm', 'md', 'lg', 'xl'];
const TYPES: AvatarType[] = ['person', 'brand'];
// A 1×1 PNG: the image variant without the network.
const PHOTO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe.each(MODES)('Avatar (%s)', (mode) => {
  it('every type × size × variant (image, fallback, icon), with and without the badge, passes axe', async () => {
    const el = await render(
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {TYPES.flatMap((type) =>
          SIZES.flatMap((size) => [
            <Avatar key={`${type}-${size}-img`} type={type} size={size} src={PHOTO} name="Marina Souza" />,
            <Avatar key={`${type}-${size}-fb`} type={type} size={size} name="Marina Souza" showBadge />,
            <Avatar key={`${type}-${size}-icon`} type={type} size={size} />,
          ]),
        )}
      </div>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });

  it('AvatarGroup with the +N passes axe', async () => {
    const el = await render(
      <AvatarGroup aria-label="Equipe do projeto" max={3}>
        <Avatar name="Ana Lima" />
        <Avatar name="Bruno Reis" />
        <Avatar src={PHOTO} name="Carla Dias" />
        <Avatar name="Davi Melo" />
        <Avatar name="Eva Nunes" />
      </AvatarGroup>,
      mode,
    );
    expect(await axeViolations(el)).toEqual([]);
  });
});

describe('Avatar behaviour', () => {
  it('the photo carries the name as alt', async () => {
    const el = await render(<Avatar src={PHOTO} name="Marina Souza" />);
    const img = el.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('Marina Souza');
    expect(el.querySelector('.rds-avatar')!.className).toContain('rds-avatar--image');
  });

  it('the initials are named by aria-label; brand takes one letter, person two', async () => {
    const el = await render(
      <div>
        <Avatar name="Marina Souza" showBadge />
        <Avatar type="brand" name="Rojão" />
        <Avatar fallbackText="MS" name="Marina" />
      </div>,
    );
    const [person, brand, custom] = el.querySelectorAll('.rds-avatar');
    expect(person.getAttribute('role')).toBe('img');
    expect(person.getAttribute('aria-label')).toBe('Marina Souza, online');
    expect(person.textContent).toBe('MS');
    expect(brand.textContent).toBe('R');
    expect(custom.textContent).toBe('MS');
  });

  it('without a name it is decorative; a broken photo falls back to the initials', async () => {
    const el = await render(
      <div>
        <Avatar />
        <Avatar src="data:image/png;base64,broken" name="Ana Lima" />
      </div>,
    );
    const [anonymous, broken] = el.querySelectorAll('.rds-avatar');
    expect(anonymous.getAttribute('aria-hidden')).toBe('true');
    expect(anonymous.querySelector('svg')).not.toBeNull();
    await expect.poll(() => broken.className).toContain('rds-avatar--fallback');
    expect(broken.getAttribute('aria-label')).toBe('Ana Lima');
    expect(broken.textContent).toBe('AL');
  });

  it('measures 24, 32, 40 and 56; AvatarGroup names the hidden rest', async () => {
    const el = await render(
      <div>
        {SIZES.map((size) => (
          <Avatar key={size} size={size} name="Ana Lima" />
        ))}
        <AvatarGroup aria-label="Equipe" max={2} size="sm">
          <Avatar name="Ana Lima" />
          <Avatar name="Bruno Reis" />
          <Avatar name="Carla Dias" />
        </AvatarGroup>
      </div>,
    );
    const widths = [...el.querySelectorAll<HTMLElement>(':scope > div > .rds-avatar')].map((a) => a.getBoundingClientRect().width);
    expect(widths).toEqual([24, 32, 40, 56]);
    const group = el.querySelector('[role="group"]')!;
    expect(group.getAttribute('aria-label')).toBe('Equipe');
    const more = group.querySelectorAll('.rds-avatar')[2];
    expect(more.getAttribute('aria-label')).toBe('mais 1 pessoa');
    expect(more.getBoundingClientRect().width).toBe(24);
  });
});

describe('Avatar vocabulary', () => {
  it('the deprecated size="default" is md, on the Avatar and the group', async () => {
    const el = await render(
      <AvatarGroup aria-label="Equipe" size="default">
        <Avatar name="Ana Lima" />
        <Avatar name="Bia Melo" size="default" />
      </AvatarGroup>,
    );
    expect(el.querySelector('.rds-avatar-group')!.className).toContain('rds-avatar-group--md');
    for (const a of el.querySelectorAll('.rds-avatar')) expect(a.className).toContain('rds-avatar--md');
  });
});
